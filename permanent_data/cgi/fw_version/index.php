<?php

$data = [
    "hw_guid" => "x11223344556677889900112233445566",
    "fw_guid" => "1233423434534534534/567575675675675612",
    "fw_version" => "VER: 123455/6",
    "fw_descr" => "Firmware description" . time(),
    "fw_upload_len" => "655355",
];

if (!empty($_POST)) {
    $data = [
        "fw_info_error" => 0
    ];
}

header('Content-Type: application/json');

echo json_encode($data);

?>