#include <libudev.h>
#include <pthread.h>

#include "detection.h"
#include "deviceList.h"

using namespace std;



/**********************************
 * Local defines
 **********************************/
#define DEVICE_ACTION_ADDED "add"
#define DEVICE_ACTION_REMOVED "remove"

#define DEVICE_TYPE_DEVICE "usb_device"

#define DEVICE_PROPERTY_NAME "ID_MODEL"
#define DEVICE_PROPERTY_SERIAL "ID_SERIAL_SHORT"
#define DEVICE_PROPERTY_VENDOR "ID_VENDOR"


/**********************************
 * Local typedefs
 **********************************/



/**********************************
 * Local Variables
 **********************************/
ListResultItem_t* currentItem;
bool isAdded;

struct udev *udev;
struct udev_enumerate *enumerate;
struct udev_list_entry *devices, *dev_list_entry;
struct udev_device *dev;

struct udev_monitor *mon;
int fd;

pthread_t thread;
pthread_mutex_t notify_mutex;
pthread_cond_t notifyNewDevice;
pthread_cond_t notifyDeviceHandled;

bool newDeviceAvailable = false;
bool deviceHandled = true;

bool isRunning = false;
/**********************************
 * Local Helper Functions protoypes
 **********************************/
void BuildInitialDeviceList();

void* ThreadFunc(void* ptr);
void WaitForDeviceHandled();
void SignalDeviceHandled();
void WaitForNewDevice();
void SignalDeviceAvailable();

/**********************************
 * Public Functions
 **********************************/
void NotifyAsync(uv_work_t* req) {
	WaitForNewDevice();
}

void NotifyFinished(uv_work_t* req) {
	if (isRunning) {
		if (isAdded) {
			NotifyAdded(currentItem);
		}
		else {
			NotifyRemoved(currentItem);
		}
	}

	// Delete Item in case of removal
	if(isAdded == false) {
		delete currentItem;
	}

	SignalDeviceHandled();
	uv_queue_work(uv_default_loop(), req, NotifyAsync, (uv_after_work_cb)NotifyFinished);
}

void Start() {
	isRunning = true;
}

void Stop() {
	isRunning = false;
	pthread_mutex_lock(&notify_mutex);
	pthread_cond_signal(&notifyNewDevice);
	pthread_mutex_unlock(&notify_mutex);
}

void InitDetection() {
	/* Create the udev object */
	udev = udev_new();
	if (!udev)
	{
		printf("Can't create udev\n");
		return;
	}

	/* Set up a monitor to monitor devices */
	mon = udev_monitor_new_from_netlink(udev, "udev");
	udev_monitor_enable_receiving(mon);

	/* Get the file descriptor (fd) for the monitor.
	   This fd will get passed to select() */
	fd = udev_monitor_get_fd(mon);

	BuildInitialDeviceList();

	pthread_mutex_init(&notify_mutex, NULL);
	pthread_cond_init(&notifyNewDevice, NULL);
	pthread_cond_init(&notifyDeviceHandled, NULL);

	uv_work_t* req = new uv_work_t();
	uv_queue_work(uv_default_loop(), req, NotifyAsync, (uv_after_work_cb)NotifyFinished);

	pthread_create(&thread, NULL, ThreadFunc, NULL);

	Start();
}


void EIO_Find(uv_work_t* req) {
	ListBaton* data = static_cast<ListBaton*>(req->data);

	CreateFilteredList(&data->results, data->vid, data->pid);
}

/**********************************
 * Local Functions
 **********************************/
void WaitForDeviceHandled() {
	pthread_mutex_lock(&notify_mutex);
	if(deviceHandled == false) {
		pthread_cond_wait(&notifyDeviceHandled, &notify_mutex);
	}
	deviceHandled = false;
	pthread_mutex_unlock(&notify_mutex);
}

void SignalDeviceHandled() {
	pthread_mutex_lock(&notify_mutex);
	deviceHandled = true;
	pthread_cond_signal(&notifyDeviceHandled);
	pthread_mutex_unlock(&notify_mutex);
}

void WaitForNewDevice() {
	pthread_mutex_lock(&notify_mutex);
	if(newDeviceAvailable == false){
		pthread_cond_wait(&notifyNewDevice, &notify_mutex);
	}
	newDeviceAvailable = false;
	pthread_mutex_unlock(&notify_mutex);
}

void SignalDeviceAvailable() {
	pthread_mutex_lock(&notify_mutex);
	newDeviceAvailable = true;
	pthread_cond_signal(&notifyNewDevice);
	pthread_mutex_unlock(&notify_mutex);
}


 ListResultItem_t* GetProperties(struct udev_device* dev, ListResultItem_t* item) {
	struct udev_list_entry* sysattrs;
	struct udev_list_entry* entry;
	sysattrs = udev_device_get_properties_list_entry(dev);
	udev_list_entry_foreach(entry, sysattrs) {
		const char *name, *value;
		name = udev_list_entry_get_name(entry);
		value = udev_list_entry_get_value(entry);

		if(strcmp(name, DEVICE_PROPERTY_NAME) == 0) {
			item->deviceName = value;
		}
		else if(strcmp(name, DEVICE_PROPERTY_SERIAL) == 0) {
			item->serialNumber = value;
		}
		else if(strcmp(name, DEVICE_PROPERTY_VENDOR) == 0) {
			item->manufacturer = value;
		}
	}
	item->vendorId = strtol(udev_device_get_sysattr_value(dev,"idVendor"), NULL, 16);
	item->productId = strtol(udev_device_get_sysattr_value(dev,"idProduct"), NULL, 16);
	item->deviceAddress = 0;
	item->locationId = 0;

	return item;
}

void DeviceAdded(struct udev_device* dev) {
	DeviceItem_t* item = new DeviceItem_t();
	GetProperties(dev, &item->deviceParams);

	AddItemToList((char *)udev_device_get_devnode(dev), item);

	currentItem = &item->deviceParams;
	isAdded = true;

	SignalDeviceAvailable();
}

void DeviceRemoved(struct udev_device* dev) {
	ListResultItem_t* item = NULL;

	if(IsItemAlreadyStored((char *)udev_device_get_devnode(dev))) {
		DeviceItem_t* deviceItem = GetItemFromList((char *)udev_device_get_devnode(dev));
		if(deviceItem) {
			item = CopyElement(&deviceItem->deviceParams);
		}
		RemoveItemFromList(deviceItem);
		delete deviceItem;
	}

	if(item == NULL) {
		item = new ListResultItem_t();
		GetProperties(dev, item);
	}

	currentItem = item;
	isAdded = false;

	SignalDeviceAvailable();
}


void* ThreadFunc(void* ptr) {
	while (1) {
		/* Make the call to receive the device.
		   select() ensured that this will not block. */
		dev = udev_monitor_receive_device(mon);
		if (dev) {
			if(udev_device_get_devtype(dev) && strcmp(udev_device_get_devtype(dev), DEVICE_TYPE_DEVICE) == 0) {
				if(strcmp(udev_device_get_action(dev), DEVICE_ACTION_ADDED) == 0) {
					WaitForDeviceHandled();
					DeviceAdded(dev);
				}
				else if(strcmp(udev_device_get_action(dev), DEVICE_ACTION_REMOVED) == 0) {
					WaitForDeviceHandled();
					DeviceRemoved(dev);
				}
			}
			udev_device_unref(dev);
		}
	}

	return NULL;
}


void BuildInitialDeviceList() {
	/* Create a list of the devices */
	enumerate = udev_enumerate_new(udev);
	udev_enumerate_scan_devices(enumerate);
	devices = udev_enumerate_get_list_entry(enumerate);
	/* For each item enumerated, print out its information.
	   udev_list_entry_foreach is a macro which expands to
	   a loop. The loop will be executed for each member in
	   devices, setting dev_list_entry to a list entry
	   which contains the device's path in /sys. */
	udev_list_entry_foreach(dev_list_entry, devices) {
		const char *path;

		/* Get the filename of the /sys entry for the device
		   and create a udev_device object (dev) representing it */
		path = udev_list_entry_get_name(dev_list_entry);
		dev = udev_device_new_from_syspath(udev, path);

		/* usb_device_get_devnode() returns the path to the device node
		   itself in /dev. */
		if(udev_device_get_devnode(dev) == NULL || udev_device_get_sysattr_value(dev,"idVendor") == NULL) {
			continue;
		}

		/* From here, we can call get_sysattr_value() for each file
		   in the device's /sys entry. The strings passed into these
		   functions (idProduct, idVendor, serial, etc.) correspond
		   directly to the files in the /sys directory which
		   represents the USB device. Note that USB strings are
		   Unicode, UCS2 encoded, but the strings returned from
		   udev_device_get_sysattr_value() are UTF-8 encoded. */

		DeviceItem_t* item = new DeviceItem_t();
		item->deviceParams.vendorId = strtol (udev_device_get_sysattr_value(dev,"idVendor"), NULL, 16);
		item->deviceParams.productId = strtol (udev_device_get_sysattr_value(dev,"idProduct"), NULL, 16);
		if(udev_device_get_sysattr_value(dev,"product") != NULL) {
			item->deviceParams.deviceName = udev_device_get_sysattr_value(dev,"product");
		}
		if(udev_device_get_sysattr_value(dev,"manufacturer") != NULL) {
			item->deviceParams.manufacturer = udev_device_get_sysattr_value(dev,"manufacturer");
		}
		if(udev_device_get_sysattr_value(dev,"serial") != NULL) {
			item->deviceParams.serialNumber = udev_device_get_sysattr_value(dev, "serial");
		}
		item->deviceParams.deviceAddress = 0;
		item->deviceParams.locationId = 0;

		item->deviceState = DeviceState_Connect;

		AddItemToList((char *)udev_device_get_devnode(dev), item);

		udev_device_unref(dev);
	}
	/* Free the enumerator object */
	udev_enumerate_unref(enumerate);
}
