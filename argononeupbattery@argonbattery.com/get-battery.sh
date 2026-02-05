#!/usr/bin/expect -f

# Spawn argon-config
spawn argon-config

# Wait for the prompt
expect "Enter Number (0-4):"

# Send '1' to get battery status
send "1\r"

# Wait for the battery line to appear
expect {
    -re {(?:Battery|Charged|Charging) [0-9]+%} 
}

# Capture the matched battery line
set battery_line $expect_out(0,string)

# Send '0' to exit argon-config
send "0\r"

exit
