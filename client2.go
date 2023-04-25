package main
import (
    "log"
    "net"
    "os"
    "os/signal"
    "syscall"
)
func main() {
    // Create a Unix domain socket and listen for incoming connections.
    socket, err := net.Listen("unix", "/tmp/echo.sock")
    if err != nil {
        log.Fatal(err)
    }
/*
    // Cleanup the sockfile.
    c := make(chan os.Signal, 1)
    signal.Notify(c, os.Interrupt, syscall.SIGTERM)
    go func() {
        <-c
        os.Remove("/tmp/echo.sock")
        os.Exit(1)
    }()
**/
    for {
        // Accept an incoming connection.
        conn, err := socket.Dial()
        if err != nil {
            log.Fatal(err)
        }

        // Handle the connection in a separate goroutine.
        go func(conn net.Conn) {
            defer conn.Close()
            // Create a buffer for incoming data.
            buf := make([]byte, 4096)

            // Read data from the connection.
            n, err := conn.Read(buf)
            if err != nil {
                log.Fatal(err)
            }
    
            buf = []byte("foo")

            // Echo the data back to the connection.
            _, err = conn.Write(buf[:n])
            if err != nil {
                log.Fatal(err)
            }
        }(conn)
    }
}

