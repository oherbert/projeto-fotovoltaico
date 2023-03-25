// modelo da praca NodeMCU 1.0 (ESP-12E Module)
#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>

const char *ssid = "LAPTOP-HJVF3GRD 6182";  // Enter SSID  casa NET_2GAC791F_EXT_2.4G
// const char *ssid = "Casa";  // Enter SSID  casa NET_2GAC791F_EXT_2.4G
const char *password = "placa123";           // Enter Password - casa DDAC791F
// const char *password = "40315003863";           // Enter Password - casa DDAC791F

const char *ipComputador = "192.168.137.1";  // Enter server adress
const uint16_t websockets_server_port = 3332;        // Enter server port

char json[] = "{\"ionizador\":{\"ph\":0,\"output\":false,\"autoStart\":{\"on\":false,\"minValue\":0,\"maxValue\":0}},\"placaSolar\":{\"tensaoEntrada\":0,\"tensaoRebaixada\":0},\"client\":\"sensor\"}";

DynamicJsonDocument sensor(1024);

using namespace websockets;
WebsocketsClient client;

void tryConnect() {
  bool connected = client.connect(ipComputador, websockets_server_port, "/");
  if (connected) {
    Serial.println("Cliente Esp conectado!");
    client.send("Olá Server: ESP8266 conectando.");
  } else {
    Serial.println("Não conectado");
  }
}

void updateServer() {
  String jsonString;
  serializeJson(sensor, jsonString);
  client.send("update: " + jsonString);
  // client.send("update: {ionizador:{ph:" + String(leitura) + ", output:" + FALSE + ", autoStart:{on:false,minValue:0,maxValue:0}}}");
}

void setup() {
  Serial.begin(115200);

  pinMode(D0, OUTPUT);

  DeserializationError error = deserializeJson(sensor, json);

  // Test if parsing succeeds.
  if (error) {
    Serial.print(F(" 47 - DeserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }

  // Connect to wifi
  WiFi.begin(ssid, password);

  // Wait some time to connect to wifi
  for (int i = 0; i < 10 && WiFi.status() != WL_CONNECTED; i++) {
    Serial.print(".");
    delay(1000);
  }

  // Check if connected to wifi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Sem Wifi!");
    return;
  }

  Serial.println("Connected to Wifi, Connecting to server.");
  // try to connect to Websockets server
  tryConnect();

  // run callback when messages are received
  client.onMessage([&](WebsocketsMessage message) {
    // Serial.print("Got Message: ");

    Serial.println(message.data());

    DynamicJsonDocument sensorServer(1024);
    DeserializationError error = deserializeJson(sensorServer, String(message.data()));

    // Test if parsing succeeds.
    if (error) {
      Serial.print(F("82 - DeserializeJson() failed: "));
      Serial.println(error.f_str());
      return;
    }

    if (sensorServer["ionizador"]["output"]) {
      sensor["ionizador"]["output"] = sensorServer["ionizador"]["output"];
      digitalWrite(D0, HIGH);
      Serial.print("high");
    } else {
      sensor["ionizador"]["output"] = sensorServer["ionizador"]["output"];
      digitalWrite(D0, LOW);
      Serial.print("low");
    }
  });
}

void loop() {
  // let the websockets client check for incoming messages
  float leitura = (analogRead(A0) * 3.3 / 1023);
  sensor["ionizador"]["ph"] =  ceilf(leitura * 100) / 100;
  if (client.available()) {
    client.poll();
    updateServer();
  } else {
    tryConnect();
  }

  Serial.println(leitura);
  delay(5000);
}