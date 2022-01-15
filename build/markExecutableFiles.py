import os
import zipfile

staging_directory = os.getenv('BUILD_STAGINGDIRECTORY')
input_archive_path = f"{staging_directory}/vscode-arduino.vsix"
output_archive_path = f"{staging_directory}/vscode-arduino-out.vsix"

filenames = [
    "extension/out/serial-monitor-cli/darwin/main",
    "extension/out/serial-monitor-cli/linux/main"
]

input_archive = zipfile.ZipFile(input_archive_path, 'r')
output_archive = zipfile.ZipFile(output_archive_path, 'w')

executable_count = 0
for info in input_archive.infolist():
    data = input_archive.read(info)
    if info.filename in filenames:
        # Magic number from from https://stackoverflow.com/a/48435482
        info.external_attr = 0o100755 << 16
        executable_count += 1
    output_archive.writestr(info, data)

if executable_count != len(filenames):
    raise Exception(f'Expected to find {len(filenames)} executables but only found {executable_count}')

input_archive.close()
output_archive.close()

os.replace(output_archive_path, input_archive_path)
os.remove(output_archive_path)
