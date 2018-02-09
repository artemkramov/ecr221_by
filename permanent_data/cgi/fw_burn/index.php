<?php

$data = [
    "fw_burn_error" => 0
];

header('Content-Type: application/json');

sleep(2);

echo json_encode($data);

?>