<?php

$binData = file_get_contents("php://input");
file_put_contents("testfile.bin", $binData);

?>