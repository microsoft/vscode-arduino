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
	void init_serialport(v8::Handle<v8::Object> target);
	void init_detector(v8::Handle<v8::Object> target);
	void initAll(v8::Handle<v8::Object> target) {
		init_serialport(target);
		init_detector(target);
	}
}

NODE_MODULE(detection, initAll);
