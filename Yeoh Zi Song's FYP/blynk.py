import BlynkLib
import time
import serial
import RPi.GPIO as GPIO

GPIO.setwarnings(False) 
GPIO.setmode(GPIO.BCM)
GPIO.setup(23, GPIO.OUT)
GPIO.setup(18, GPIO.OUT)
GPIO.output(18, GPIO.LOW)
GPIO.output(23, GPIO.LOW)

# Blynk authentication token
BLYNK_AUTH = 'UIFGFZl6zERAEufRqDqUtsVa7UH_2tQq'

# Initialize Blynk
blynk = BlynkLib.Blynk(BLYNK_AUTH)



# Lockdown control through V0 virtual pin
@blynk.on("V0")
def v0_write_handler(value):
#    global led_switch
    if int(value[0]) is not 0:
        GPIO.output(23, GPIO.HIGH)
        GPIO.output(18, GPIO.HIGH)
        print('Lockdown Initiated')
    else:
        GPIO.output(23, GPIO.LOW)
        GPIO.output(18, GPIO.LOW)
        print('Lockdown Removed')

# Function to connect to Blynk
def connect_to_blynk():
    print("Connecting to Blynk...")
    while not blynk.connect():
        pass
    print("Connected to Blynk")

# Blynk connection callback
@blynk.on("connected")
def blynk_connected():
    print("Connected to Blynk Server")

# Blynk disconnection callback
@blynk.on("disconnected")
def blynk_disconnected():
    print("Disconnected from Blynk Server")

# Main loop
while True:
    # Run Blynk
    blynk.run()



    # Your code to interact with sensors or perform actions
    # Example: Read sensor data and update Blynk virtual pins
    # sensor_data = read_sensor()
    # blynk.virtual_write(0, sensor_data)

    time.sleep(1)
