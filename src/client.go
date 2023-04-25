package main

import (
    "bufio"
    "fmt"
    "net"
    "os"
)

const SOCKETFILE = "/tmp/unix.sock"

func main() {
    // Connect to the Unix socket.
    conn, err := net.Dial("unix", SOCKETFILE)
    if err != nil {
        fmt.Println("Connection error:", err)
        return
    }
    defer conn.Close()

    // Start reading from the connection.
    go func() {
        reader := bufio.NewReader(conn)
        for {
            message, err := reader.ReadString('\n')
            if err != nil {
                fmt.Println("Error reading from connection:", err)
                return
            }
            // Print the received message.
            fmt.Print("Server: ", message)
        }
    }()

    // Read input from the user and send it to the server.
    scanner := bufio.NewScanner(os.Stdin)
    for scanner.Scan() {
        input := scanner.Text()
        if input == "exit" || input == "quit" {
            // User has entered an exit command.
            break
        }
        // Send the input to the server.
        _, err := conn.Write([]byte(input + "\n"))
        if err != nil {
            fmt.Println("Error sending data to server:", err)
            return
        }
    }
}
