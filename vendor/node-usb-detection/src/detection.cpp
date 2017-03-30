#include "detection.h"


#define OBJECT_ITEM_LOCATION_ID "locationId"
#define OBJECT_ITEM_VENDOR_ID "vendorId"
#define OBJECT_ITEM_PRODUCT_ID "productId"
#define OBJECT_ITEM_DEVICE_NAME "deviceName"
#define OBJECT_ITEM_MANUFACTURER "manufacturer"
#define OBJECT_ITEM_SERIAL_NUMBER "serialNumber"
#define OBJECT_ITEM_DEVICE_ADDRESS "deviceAddress"


Nan::Callback* addedCallback;
bool isAddedRegistered = false;

Nan::Callback* removedCallback;
bool isRemovedRegistered = false;

void RegisterAdded(const Nan::FunctionCallbackInfo<v8::Value>& args) {
	Nan::HandleScope scope;

	v8::Local<v8::Function> callback;

	if (args.Length() == 0) {
		return Nan::ThrowTypeError("First argument must be a function");
	}

	if (args.Length() == 1) {
		// callback
		if(!args[0]->IsFunction()) {
			return Nan::ThrowTypeError("First argument must be a function");
		}

		callback = args[0].As<v8::Function>();
	}

	addedCallback = new Nan::Callback(callback);
	isAddedRegistered = true;
}

void NotifyAdded(ListResultItem_t* it) {
	Nan::HandleScope scope;

	if (it == NULL) {
		return;
	}

	if (isAddedRegistered){
		v8::Local<v8::Value> argv[1];
		v8::Local<v8::Object> item = Nan::New<v8::Object>();
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_LOCATION_ID).ToLocalChecked(), Nan::New<v8::Number>(it->locationId));
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_VENDOR_ID).ToLocalChecked(), Nan::New<v8::Number>(it->vendorId));
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_PRODUCT_ID).ToLocalChecked(), Nan::New<v8::Number>(it->productId));
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_DEVICE_NAME).ToLocalChecked(), Nan::New<v8::String>(it->deviceName.c_str()).ToLocalChecked());
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_MANUFACTURER).ToLocalChecked(), Nan::New<v8::String>(it->manufacturer.c_str()).ToLocalChecked());
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_SERIAL_NUMBER).ToLocalChecked(), Nan::New<v8::String>(it->serialNumber.c_str()).ToLocalChecked());
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_DEVICE_ADDRESS).ToLocalChecked(), Nan::New<v8::Number>(it->deviceAddress));
		argv[0] = item;

		addedCallback->Call(1, argv);
	}
}

void RegisterRemoved(const Nan::FunctionCallbackInfo<v8::Value>& args) {
	Nan::HandleScope scope;

	v8::Local<v8::Function> callback;

	if (args.Length() == 0) {
		return Nan::ThrowTypeError("First argument must be a function");
	}

	if (args.Length() == 1) {
		// callback
		if(!args[0]->IsFunction()) {
			return Nan::ThrowTypeError("First argument must be a function");
		}

		callback = args[0].As<v8::Function>();
	}

	removedCallback = new Nan::Callback(callback);
	isRemovedRegistered = true;
}

void NotifyRemoved(ListResultItem_t* it) {
	Nan::HandleScope scope;

	if (it == NULL) {
		return;
	}

	if (isRemovedRegistered) {
		v8::Local<v8::Value> argv[1];
		v8::Local<v8::Object> item = Nan::New<v8::Object>();
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_LOCATION_ID).ToLocalChecked(), Nan::New<v8::Number>(it->locationId));
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_VENDOR_ID).ToLocalChecked(), Nan::New<v8::Number>(it->vendorId));
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_PRODUCT_ID).ToLocalChecked(), Nan::New<v8::Number>(it->productId));
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_DEVICE_NAME).ToLocalChecked(), Nan::New<v8::String>(it->deviceName.c_str()).ToLocalChecked());
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_MANUFACTURER).ToLocalChecked(), Nan::New<v8::String>(it->manufacturer.c_str()).ToLocalChecked());
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_SERIAL_NUMBER).ToLocalChecked(), Nan::New<v8::String>(it->serialNumber.c_str()).ToLocalChecked());
		item->Set(Nan::New<v8::String>(OBJECT_ITEM_DEVICE_ADDRESS).ToLocalChecked(), Nan::New<v8::Number>(it->deviceAddress));
		argv[0] = item;

		removedCallback->Call(1, argv);
	}
}

void Find(const Nan::FunctionCallbackInfo<v8::Value>& args) {
	Nan::HandleScope scope;

	int vid = 0;
	int pid = 0;
	v8::Local<v8::Function> callback;

	if (args.Length() == 0) {
		return Nan::ThrowTypeError("First argument must be a function");
	}

	if (args.Length() == 3) {
		if (args[0]->IsNumber() && args[1]->IsNumber()) {
			vid = (int) args[0]->NumberValue();
			pid = (int) args[1]->NumberValue();
		}

		// callback
		if(!args[2]->IsFunction()) {
			return Nan::ThrowTypeError("Third argument must be a function");
		}

		callback = args[2].As<v8::Function>();
	}

	if (args.Length() == 2) {
		if (args[0]->IsNumber()) {
			vid = (int) args[0]->NumberValue();
		}

		// callback
		if(!args[1]->IsFunction()) {
			return Nan::ThrowTypeError("Second argument must be a function");
		}

		callback = args[1].As<v8::Function>();
	}

	if (args.Length() == 1) {
		// callback
		if(!args[0]->IsFunction()) {
			return Nan::ThrowTypeError("First argument must be a function");
		}

		callback = args[0].As<v8::Function>();
	}

	ListBaton* baton = new ListBaton();
	strcpy(baton->errorString, "");
	baton->callback = new Nan::Callback(callback);
	baton->vid = vid;
	baton->pid = pid;

	uv_work_t* req = new uv_work_t();
	req->data = baton;
	uv_queue_work(uv_default_loop(), req, EIO_Find, (uv_after_work_cb)EIO_AfterFind);
}

void EIO_AfterFind(uv_work_t* req) {
	Nan::HandleScope scope;

	ListBaton* data = static_cast<ListBaton*>(req->data);

	v8::Local<v8::Value> argv[2];
	if(data->errorString[0]) {
		argv[0] = v8::Exception::Error(Nan::New<v8::String>(data->errorString).ToLocalChecked());
		argv[1] = Nan::Undefined();
	}
	else {
		v8::Local<v8::Array> results = Nan::New<v8::Array>();
		int i = 0;
		for(std::list<ListResultItem_t*>::iterator it = data->results.begin(); it != data->results.end(); it++, i++) {
			v8::Local<v8::Object> item = Nan::New<v8::Object>();
			item->Set(Nan::New<v8::String>(OBJECT_ITEM_LOCATION_ID).ToLocalChecked(), Nan::New<v8::Number>((*it)->locationId));
			item->Set(Nan::New<v8::String>(OBJECT_ITEM_VENDOR_ID).ToLocalChecked(), Nan::New<v8::Number>((*it)->vendorId));
			item->Set(Nan::New<v8::String>(OBJECT_ITEM_PRODUCT_ID).ToLocalChecked(), Nan::New<v8::Number>((*it)->productId));
			item->Set(Nan::New<v8::String>(OBJECT_ITEM_DEVICE_NAME).ToLocalChecked(), Nan::New<v8::String>((*it)->deviceName.c_str()).ToLocalChecked());
			item->Set(Nan::New<v8::String>(OBJECT_ITEM_MANUFACTURER).ToLocalChecked(), Nan::New<v8::String>((*it)->manufacturer.c_str()).ToLocalChecked());
			item->Set(Nan::New<v8::String>(OBJECT_ITEM_SERIAL_NUMBER).ToLocalChecked(), Nan::New<v8::String>((*it)->serialNumber.c_str()).ToLocalChecked());
			item->Set(Nan::New<v8::String>(OBJECT_ITEM_DEVICE_ADDRESS).ToLocalChecked(), Nan::New<v8::Number>((*it)->deviceAddress));
			results->Set(i, item);
		}
		argv[0] = Nan::Undefined();
		argv[1] = results;
	}

	data->callback->Call(2, argv);

	for(std::list<ListResultItem_t*>::iterator it = data->results.begin(); it != data->results.end(); it++) {
		delete *it;
	}
	delete data;
	delete req;
}

void StartMonitoring(const Nan::FunctionCallbackInfo<v8::Value>& args) {
	Start();
}

void StopMonitoring(const Nan::FunctionCallbackInfo<v8::Value>& args) {
	Stop();
}

extern "C" {
	void init (v8::Handle<v8::Object> target) {
		Nan::SetMethod(target, "find", Find);
		Nan::SetMethod(target, "registerAdded", RegisterAdded);
		Nan::SetMethod(target, "registerRemoved", RegisterRemoved);
		Nan::SetMethod(target, "startMonitoring", StartMonitoring);
		Nan::SetMethod(target, "stopMonitoring", StopMonitoring);
		InitDetection();
	}
}

NODE_MODULE(detection, init);
