#include <uv.h>
#include <dbt.h>
#include <iostream>
#include <iomanip>
#include <atlstr.h>


// Include Windows headers
#include <windows.h>
#include <stdio.h>
#include <tchar.h>
#include <strsafe.h>
#include <Setupapi.h>

#include "detection.h"
#include "deviceList.h"

using namespace std;

/**********************************
 * Local defines
 **********************************/
#define VID_TAG "VID_"
#define PID_TAG "PID_"

#define LIBRARY_NAME ("setupapi.dll")


#define DllImport __declspec(dllimport)

#define MAX_THREAD_WINDOW_NAME 64

/**********************************
 * Local typedefs
 **********************************/



/**********************************
 * Local Variables
 **********************************/
GUID GUID_DEVINTERFACE_USB_DEVICE = {
	0xA5DCBF10L,
	0x6530,
	0x11D2,
	0x90,
	0x1F,
	0x00,
	0xC0,
	0x4F,
	0xB9,
	0x51,
	0xED
};

HWND handle;
DWORD threadId;
HANDLE threadHandle;

HANDLE deviceChangedRegisteredEvent;
HANDLE deviceChangedSentEvent;

ListResultItem_t* currentDevice;
bool isAdded;
bool isRunning = false;

HINSTANCE hinstLib;


typedef BOOL (WINAPI *_SetupDiEnumDeviceInfo) (HDEVINFO DeviceInfoSet, DWORD MemberIndex, PSP_DEVINFO_DATA DeviceInfoData);
typedef HDEVINFO (WINAPI *_SetupDiGetClassDevs) (const GUID *ClassGuid, PCTSTR Enumerator, HWND hwndParent, DWORD Flags);
typedef BOOL (WINAPI *_SetupDiDestroyDeviceInfoList) (HDEVINFO DeviceInfoSet);
typedef BOOL (WINAPI *_SetupDiGetDeviceInstanceId) (HDEVINFO DeviceInfoSet, PSP_DEVINFO_DATA DeviceInfoData, PTSTR DeviceInstanceId, DWORD DeviceInstanceIdSize, PDWORD RequiredSize);
typedef BOOL (WINAPI *_SetupDiGetDeviceRegistryProperty) (HDEVINFO DeviceInfoSet, PSP_DEVINFO_DATA DeviceInfoData, DWORD Property, PDWORD PropertyRegDataType, PBYTE PropertyBuffer, DWORD PropertyBufferSize, PDWORD RequiredSize);


_SetupDiEnumDeviceInfo DllSetupDiEnumDeviceInfo;
_SetupDiGetClassDevs DllSetupDiGetClassDevs;
_SetupDiDestroyDeviceInfoList DllSetupDiDestroyDeviceInfoList;
_SetupDiGetDeviceInstanceId DllSetupDiGetDeviceInstanceId;
_SetupDiGetDeviceRegistryProperty DllSetupDiGetDeviceRegistryProperty;


/**********************************
 * Local Helper Functions protoypes
 **********************************/
void UpdateDevice(PDEV_BROADCAST_DEVICEINTERFACE pDevInf, WPARAM wParam, DeviceState_t state);
DWORD WINAPI ListenerThread(LPVOID lpParam);

void BuildInitialDeviceList();

void NotifyAsync(uv_work_t* req);
void NotifyFinished(uv_work_t* req);

void ExtractDeviceInfo(HDEVINFO hDevInfo, SP_DEVINFO_DATA* pspDevInfoData, TCHAR* buf, DWORD buffSize, ListResultItem_t* resultItem);
bool CheckValidity(ListResultItem_t* item);


/**********************************
 * Public Functions
 **********************************/
void NotifyAsync(uv_work_t* req) {
	WaitForSingleObject(deviceChangedRegisteredEvent, INFINITE);
}


void NotifyFinished(uv_work_t* req) {
	if (isRunning) {
		if(isAdded) {
			NotifyAdded(currentDevice);
		}
		else {
			NotifyRemoved(currentDevice);
		}
	}

	// Delete Item in case of removal
	if(isAdded == false) {
		delete currentDevice;
	}

	SetEvent(deviceChangedSentEvent);

	currentDevice = NULL;
	uv_queue_work(uv_default_loop(), req, NotifyAsync, (uv_after_work_cb)NotifyFinished);
}

void LoadFunctions() {

	bool success;

	hinstLib = LoadLibrary(LIBRARY_NAME);

	if (hinstLib != NULL) {
		DllSetupDiEnumDeviceInfo = (_SetupDiEnumDeviceInfo) GetProcAddress(hinstLib, "SetupDiEnumDeviceInfo");

		DllSetupDiGetClassDevs = (_SetupDiGetClassDevs) GetProcAddress(hinstLib, "SetupDiGetClassDevsA");

		DllSetupDiDestroyDeviceInfoList = (_SetupDiDestroyDeviceInfoList) GetProcAddress(hinstLib, "SetupDiDestroyDeviceInfoList");

		DllSetupDiGetDeviceInstanceId = (_SetupDiGetDeviceInstanceId) GetProcAddress(hinstLib, "SetupDiGetDeviceInstanceIdA");

		DllSetupDiGetDeviceRegistryProperty = (_SetupDiGetDeviceRegistryProperty) GetProcAddress(hinstLib, "SetupDiGetDeviceRegistryPropertyA");

		success = (
			DllSetupDiEnumDeviceInfo != NULL &&
			DllSetupDiGetClassDevs != NULL &&
			DllSetupDiDestroyDeviceInfoList != NULL &&
			DllSetupDiGetDeviceInstanceId != NULL &&
			DllSetupDiGetDeviceRegistryProperty != NULL
		);
	}
	else {
		success = false;
	}

	if(!success) {
		printf("Could not load library functions from dll -> abort (Check if %s is available)\r\n", LIBRARY_NAME);
		exit(1);
	}
}

void Start() {
	isRunning = true;
}

void Stop() {
	isRunning = false;
	SetEvent(deviceChangedRegisteredEvent);
}

void InitDetection() {

	LoadFunctions();

	deviceChangedRegisteredEvent = CreateEvent(NULL, false /* auto-reset event */, false /* non-signalled state */, "");
	deviceChangedSentEvent = CreateEvent(NULL, false /* auto-reset event */, true /* non-signalled state */, "");

	BuildInitialDeviceList();

	threadHandle = CreateThread(
			NULL,				// default security attributes
			0,					// use default stack size
			ListenerThread,		// thread function name
			NULL,				// argument to thread function
			0,					// use default creation flags
			&threadId
		);

	uv_work_t* req = new uv_work_t();
	uv_queue_work(uv_default_loop(), req, NotifyAsync, (uv_after_work_cb)NotifyFinished);

	Start();
}


void EIO_Find(uv_work_t* req) {

	ListBaton* data = static_cast<ListBaton*>(req->data);

	CreateFilteredList(&data->results, data->vid, data->pid);
}


/**********************************
 * Local Functions
 **********************************/
void ToUpper(char * buf) {
	char* c = buf;
	while (*c != '\0') {
		*c = toupper((unsigned char)*c);
		c++;
	}
}


void extractVidPid(char * buf, ListResultItem_t * item) {
	if(buf == NULL) {
		return;
	}

	ToUpper(buf);

	char* string;
	char* temp;
	char* pidStr, *vidStr;
	int vid = 0;
	int pid = 0;

	string = new char[strlen(buf) + 1];
	memcpy(string, buf, strlen(buf) + 1);

	vidStr = strstr(string, VID_TAG);
	pidStr = strstr(string, PID_TAG);

	if(vidStr != NULL) {
		temp = (char*) (vidStr + strlen(VID_TAG));
		temp[4] = '\0';
		vid = strtol (temp, NULL, 16);
	}

	if(pidStr != NULL) {
		temp = (char*) (pidStr + strlen(PID_TAG));
		temp[4] = '\0';
		pid = strtol (temp, NULL, 16);
	}
	item->vendorId = vid;
	item->productId = pid;

	delete string;
}


LRESULT CALLBACK DetectCallback(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
	if (msg == WM_DEVICECHANGE) {
		if ( DBT_DEVICEARRIVAL == wParam || DBT_DEVICEREMOVECOMPLETE == wParam ) {
			PDEV_BROADCAST_HDR pHdr = (PDEV_BROADCAST_HDR)lParam;
			PDEV_BROADCAST_DEVICEINTERFACE pDevInf;

			if(pHdr->dbch_devicetype == DBT_DEVTYP_DEVICEINTERFACE) {
				pDevInf = (PDEV_BROADCAST_DEVICEINTERFACE)pHdr;
				UpdateDevice(pDevInf, wParam, (DBT_DEVICEARRIVAL == wParam) ? DeviceState_Connect : DeviceState_Disconnect);
			}
		}
	}

	return 1;
}


DWORD WINAPI ListenerThread( LPVOID lpParam ) {
	char className[MAX_THREAD_WINDOW_NAME];
	_snprintf_s(className, MAX_THREAD_WINDOW_NAME, "ListnerThreadUsbDetection_%d", GetCurrentThreadId());

	WNDCLASSA wincl = {0};
	wincl.hInstance = GetModuleHandle(0);
	wincl.lpszClassName = className;
	wincl.lpfnWndProc = DetectCallback;

	if (!RegisterClassA(&wincl)) {
		DWORD le = GetLastError();
		printf("RegisterClassA() failed [Error: %x]\r\n", le);
		return 1;
	}


	HWND hwnd = CreateWindowExA(WS_EX_TOPMOST, className, className, 0, 0, 0, 0, 0, NULL, 0, 0, 0);
	if (!hwnd) {
		DWORD le = GetLastError();
		printf("CreateWindowExA() failed [Error: %x]\r\n", le);
		return 1;
	}

	DEV_BROADCAST_DEVICEINTERFACE_A notifyFilter = {0};
	notifyFilter.dbcc_size = sizeof(notifyFilter);
	notifyFilter.dbcc_devicetype = DBT_DEVTYP_DEVICEINTERFACE;
	notifyFilter.dbcc_classguid = GUID_DEVINTERFACE_USB_DEVICE;

	HDEVNOTIFY hDevNotify = RegisterDeviceNotificationA(hwnd, &notifyFilter, DEVICE_NOTIFY_WINDOW_HANDLE);
	if (!hDevNotify) {
		DWORD le = GetLastError();
		printf("RegisterDeviceNotificationA() failed [Error: %x]\r\n", le);
		return 1;
	}

	MSG msg;
	while(TRUE) {
		BOOL bRet = GetMessage(&msg, hwnd, 0, 0);
		if ((bRet == 0) || (bRet == -1)) {
			break;
		}

		TranslateMessage(&msg);
		DispatchMessage(&msg);
	}

	return 0;
}


void BuildInitialDeviceList() {
	TCHAR buf[MAX_PATH];
	DWORD dwFlag = (DIGCF_ALLCLASSES | DIGCF_PRESENT);
	HDEVINFO hDevInfo = DllSetupDiGetClassDevs(NULL, "USB", NULL, dwFlag);

	if(INVALID_HANDLE_VALUE == hDevInfo) {
		return;
	}

	SP_DEVINFO_DATA* pspDevInfoData = (SP_DEVINFO_DATA*) HeapAlloc(GetProcessHeap(), 0, sizeof(SP_DEVINFO_DATA));
	pspDevInfoData->cbSize = sizeof(SP_DEVINFO_DATA);
	for(int i=0; DllSetupDiEnumDeviceInfo(hDevInfo, i, pspDevInfoData); i++) {
		DWORD nSize=0 ;

		if (!DllSetupDiGetDeviceInstanceId(hDevInfo, pspDevInfoData, buf, sizeof(buf), &nSize)) {
			break;
		}

		DeviceItem_t* item = new DeviceItem_t();
		item->deviceState = DeviceState_Connect;

		DWORD DataT;
		DllSetupDiGetDeviceRegistryProperty(hDevInfo, pspDevInfoData, SPDRP_HARDWAREID, &DataT, (PBYTE)buf, MAX_PATH, &nSize);

		AddItemToList(buf, item);
		ExtractDeviceInfo(hDevInfo, pspDevInfoData, buf, MAX_PATH, &item->deviceParams);
	}

	if(pspDevInfoData) {
		HeapFree(GetProcessHeap(), 0, pspDevInfoData);
	}

	if(hDevInfo) {
		DllSetupDiDestroyDeviceInfoList(hDevInfo);
	}
}


void ExtractDeviceInfo(HDEVINFO hDevInfo, SP_DEVINFO_DATA* pspDevInfoData, TCHAR* buf, DWORD buffSize, ListResultItem_t* resultItem) {

	DWORD DataT;
	DWORD nSize;
	static int dummy = 1;

	resultItem->locationId = 0;
	resultItem->deviceAddress = dummy++;

	// device found
	if (DllSetupDiGetDeviceRegistryProperty(hDevInfo, pspDevInfoData, SPDRP_FRIENDLYNAME, &DataT, (PBYTE)buf, buffSize, &nSize)) {
		resultItem->deviceName = buf;
	}
	else if ( DllSetupDiGetDeviceRegistryProperty(hDevInfo, pspDevInfoData, SPDRP_DEVICEDESC, &DataT, (PBYTE)buf, buffSize, &nSize))
	{
		resultItem->deviceName = buf;
	}
	if (DllSetupDiGetDeviceRegistryProperty(hDevInfo, pspDevInfoData, SPDRP_MFG, &DataT, (PBYTE)buf, buffSize, &nSize)) {
		resultItem->manufacturer = buf;
	}
	if (DllSetupDiGetDeviceRegistryProperty(hDevInfo, pspDevInfoData, SPDRP_HARDWAREID, &DataT, (PBYTE)buf, buffSize, &nSize)) {
		// Use this to extract VID / PID
		extractVidPid(buf, resultItem);
	}
}


void UpdateDevice(PDEV_BROADCAST_DEVICEINTERFACE pDevInf, WPARAM wParam, DeviceState_t state) {
	// dbcc_name:
	// \\?\USB#Vid_04e8&Pid_503b#0002F9A9828E0F06#{a5dcbf10-6530-11d2-901f-00c04fb951ed}
	// convert to
	// USB\Vid_04e8&Pid_503b\0002F9A9828E0F06
	CString szDevId = pDevInf->dbcc_name+4;
	int idx = szDevId.ReverseFind(_T('#'));

	szDevId.Truncate(idx);
	szDevId.Replace(_T('#'), _T('\\'));
	szDevId.MakeUpper();

	CString szClass;
	idx = szDevId.Find(_T('\\'));
	szClass = szDevId.Left(idx);

	// if we are adding device, we only need present devices
	// otherwise, we need all devices
	DWORD dwFlag = DBT_DEVICEARRIVAL != wParam ? DIGCF_ALLCLASSES : (DIGCF_ALLCLASSES | DIGCF_PRESENT);
	HDEVINFO hDevInfo = DllSetupDiGetClassDevs(NULL, szClass, NULL, dwFlag);
	if(INVALID_HANDLE_VALUE == hDevInfo) {
		return;
	}

	SP_DEVINFO_DATA* pspDevInfoData = (SP_DEVINFO_DATA*) HeapAlloc(GetProcessHeap(), 0, sizeof(SP_DEVINFO_DATA));
	pspDevInfoData->cbSize = sizeof(SP_DEVINFO_DATA);
	for(int i=0; DllSetupDiEnumDeviceInfo(hDevInfo, i, pspDevInfoData); i++) {
		DWORD nSize=0 ;
		TCHAR buf[MAX_PATH];

		if (!DllSetupDiGetDeviceInstanceId(hDevInfo, pspDevInfoData, buf, sizeof(buf), &nSize)) {
			break;
		}

		if(szDevId == buf) {

			WaitForSingleObject(deviceChangedSentEvent, INFINITE);

			DWORD DataT;
			DWORD nSize;
			DllSetupDiGetDeviceRegistryProperty(hDevInfo, pspDevInfoData, SPDRP_HARDWAREID, &DataT, (PBYTE)buf, MAX_PATH, &nSize);

			if(state == DeviceState_Connect) {
				DeviceItem_t* device = new DeviceItem_t();

				AddItemToList(buf, device);
				ExtractDeviceInfo(hDevInfo, pspDevInfoData, buf, MAX_PATH, &device->deviceParams);

				currentDevice = &device->deviceParams;
				isAdded = true;
			}
			else {

				ListResultItem_t* item = NULL;
				if(IsItemAlreadyStored(buf)) {
					DeviceItem_t* deviceItem = GetItemFromList(buf);
					if(deviceItem)
					{
						item = CopyElement(&deviceItem->deviceParams);
					}
					RemoveItemFromList(deviceItem);
					delete deviceItem;
				}

				if(item == NULL) {
					item = new ListResultItem_t();
					ExtractDeviceInfo(hDevInfo, pspDevInfoData, buf, MAX_PATH, item);
				}
				currentDevice = item;
				isAdded = false;
			}

			break;
		}
	}

	if (pspDevInfoData) {
		HeapFree(GetProcessHeap(), 0, pspDevInfoData);
	}

	if(hDevInfo) {
		DllSetupDiDestroyDeviceInfoList(hDevInfo);
	}

	SetEvent(deviceChangedRegisteredEvent);
}
