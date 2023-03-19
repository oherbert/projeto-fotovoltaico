// modelo da praca NodeMCU 1.0 (ESP-12E Module)
#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>

const char *ssid = "NET_2GAC791F_EXT_2.4G"; // Enter SSID  casa NET_2GAC791F_EXT_2.4G
const char *password = "DDAC791F";          // Enter Password - casa DDAC791F

const char *websockets_server_host = "192.168.0.6"; // Enter server adress
const uint16_t websockets_server_port = 3333;       // Enter server port

const char *TRUE = "true" const char *FALSE = "false"

    float leitura;
bool ionizador = false;

using namespace websockets;

WebsocketsClient client;

void tryConnect()
{
  bool connected = client.connect(websockets_server_host, websockets_server_port, "/");
  if (connected)
  {
    Serial.println("Cliente Esp conectado!");
    client.send("Olá Server: ESP8266 conectando.");
  }
  else
  {
    Serial.println("Não conectado");
  }
}
void updateServer()
{
  if ionizador
  {
    client.send("update: {ionizador:{ph:" + 2 + ", output:" + String(leitura) + ", autoStart:{on:false,minValue:0,maxValue:0}}}");
  }
  else
  {
    client.send("update: {ionizador:{ph:" + 2 + ", output:" + String(leitura) + ", autoStart:{on:false,minValue:0,maxValue:0}}}");
  }
}

void setup()
{
  Serial.begin(115200);

  pinMode(2, OUTPUT);

  // Connect to wifi
  WiFi.begin(ssid, password);

  // Wait some time to connect to wifi
  for (int i = 0; i < 10 && WiFi.status() != WL_CONNECTED; i++)
  {
    Serial.print(".");
    delay(1000);
  }

  // Check if connected to wifi
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Sem Wifi!");
    return;
  }

  Serial.println("Connected to Wifi, Connecting to server.");
  // try to connect to Websockets server
  tryConnect();

  // run callback when messages are received
  client.onMessage([&](WebsocketsMessage message)
                   {
    // Serial.print("Got Message: ");
    Serial.println(message.data());
    if (message.data() = "true") {
      ionizador = true;
      digitalWrite(2, HIGH);
      Serial.println(message.data());
      Serial.print("high");
    } else {
      ionizador = false;
      digitalWrite(2, LOW);
      Serial.println(message.data());
      Serial.print("low");
    } });
}

void loop()
{
  // let the websockets client check for incoming messages
  leitura = (analogRead(A0) * 3.3 / 1023);
  if (client.available())
  {
    client.poll();
    updateServer();
  }
  else
  {
    tryConnect();
  }

  Serial.println(leitura);
  delay(3000);
}