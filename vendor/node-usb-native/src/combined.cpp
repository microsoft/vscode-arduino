#include <node.h>
#include <v8.h>
#include <uv.h>
#include <list>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <nan.h>

extern "C" {
	void init_serialport( v8::Local<v8::Object> target);
#ifndef DISABLE_USB_DETECTOR
	void init_detector( v8::Local<v8::Object> target);
#endif
	void initAll( v8::Local<v8::Object> target) {
		init_serialport(target);
		#ifndef DISABLE_USB_DETECTOR
		init_detector(target);
		#endif
	}
}

NODE_MODULE(detection, initAll);
