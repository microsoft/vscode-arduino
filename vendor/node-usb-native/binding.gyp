{
    "targets": [
        {
            "target_name": "usb-native",
            "sources": [
                "src/detection.cpp",
                "src/detection.h",
                "src/deviceList.cpp",
                "src/combined.cpp",
                "src/serialport.cpp"
            ],
            "include_dirs": [
                "<!(node -e \"require('nan')\")"
            ],
            "conditions": [
                [
                    "OS=='win'",
                    {
                        "sources": [
                            "src/detection_win.cpp",
                            "src/serialport_win.cpp"
                        ],
                        "msvs_settings": {
                            "VCCLCompilerTool": {
                                "ExceptionHandling": "2",
                                "DisableSpecificWarnings": [
                                    "4530",
                                    "4506"
                                ]
                            }
                        },
                        "include_dirs+": []
                    }
                ],
                [
                    "OS=='mac'",
                    {
                        "sources": [
                            "src/detection_mac.cpp",
                            "src/serialport_unix.cpp",
                            "src/serialport_poller.cpp"
                        ],
                        "libraries": [
                            "-framework CoreFoundation -framework IOKit"
                        ]
                    }
                ],
                [
                    "OS=='linux'",
                    {
                        "sources": [
                            "src/detection_linux.cpp",
                            "src/serialport_unix.cpp",
                            "src/serialport_poller.cpp"
                        ],
                        "defines": [
                          "DISABLE_USB_DETECTOR"
                        ]
                    }
                ]
            ]
        }
    ]
}