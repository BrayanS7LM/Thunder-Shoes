<?php
session_start();

if (isset($_SESSION['autenticado']) && $_SESSION['autenticado'] === true) {
    echo "OK";
} else {
    echo "NO_AUTORIZADO";
}
?>
