#ifndef _DEVICE_LIST_H
#define _DEVICE_LIST_H

#include <string>
#include <list>

typedef struct {
	public:
		int locationId;
		int vendorId;
		int productId;
		std::string deviceName;
		std::string manufacturer;
		std::string serialNumber;
		int deviceAddress;
} ListResultItem_t;

typedef enum  _DeviceState_t {
	DeviceState_Connect,
	DeviceState_Disconnect,
} DeviceState_t;

typedef struct _DeviceItem_t {
	ListResultItem_t deviceParams;
	DeviceState_t deviceState;

	private:
		char* key;


	public:
		_DeviceItem_t() {
			key = NULL;
		}

		~_DeviceItem_t() {
			if(this->key != NULL) {
				delete this->key;
			}
		}

		void SetKey(char* key) {
			if(this->key != NULL) {
				delete this->key;
			}
			this->key = new char[strlen(key) + 1];
			memcpy(this->key, key, strlen(key) + 1);
		}

		char* GetKey() {
			return this->key;
		}
} DeviceItem_t;


void AddItemToList(char* key, DeviceItem_t * item);
void RemoveItemFromList(DeviceItem_t* item);
bool IsItemAlreadyStored(char* identifier);
DeviceItem_t* GetItemFromList(char* key);
ListResultItem_t* CopyElement(ListResultItem_t* item);
void CreateFilteredList(std::list<ListResultItem_t*>* filteredList, int vid, int pid);

#endif
