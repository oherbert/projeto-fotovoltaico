
#define SensorPin A0
// modelo da praca NodeMCU 1.0 (ESP-12E Module) or wemos mega https://arduino.esp8266.com/stable/package_esp8266com_index.json
#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>

// const char *ssid = "NET_2GAC791F_EXT_2.4G";  // Enter SSID  casa NET_2GAC791F_EXT_2.4G
const char *ssid = "LAPTOP-HJVF3GRD 6182";  // Enter SSID  casa NET_2GAC791F_EXT_2.4G
// const char *password = "DDAC791F";           // Enter Password - casa DDAC791F
const char *password = "placa123";  // Enter Password - casa DDAC791F

const char *websockets_server_host = "192.168.137.1";;  // Enter server adress
const uint16_t websockets_server_port = 3332;        // Enter server port

char json[] = "{\"ionizador\":{\"ph\":0,\"output\":false,\"autoStart\":{\"on\":false,\"minValue\":0,\"maxValue\":0}},\"placaSolar\":{\"tensaoEntrada\":0,\"tensaoRebaixada\":0},\"client\":\"sensor\"}";


unsigned long int avgValue;  //Armazene o valor médio do feedback do sensor
float b;
int buf[10],temp;

DynamicJsonDocument sensor(1024);

using namespace websockets;
WebsocketsClient client;

float lerSensor();
void tryConnect();
void updateServer();

void setup() {
  Serial.begin(115200);

  pinMode(2, OUTPUT);

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
      digitalWrite(2, HIGH);
      Serial.print("high");
    } else {
      sensor["ionizador"]["output"] = sensorServer["ionizador"]["output"];
      digitalWrite(2, LOW);
      Serial.print("low");
    }
  });
}

void loop() {
  // let the websockets client check for incoming messages
  float leitura = lerSensor();
  sensor["ionizador"]["ph"] = ceilf(leitura * 100) / 100;
  if (client.available()) {
    client.poll();
    updateServer();
  } else {
    tryConnect();
  }

  Serial.println(leitura);
  delay(5000);
}

float lerSensor() {
  for (int i = 0; i < 10; i++)  //Obtenha 10 valores de amostra do sensor para suavizar o valor
  {
    buf[i] = analogRead(SensorPin);
    delay(10);
  }
  for (int i = 0; i < 9; i++)  //classificar o analógico de pequeno para grande
  {
    for (int j = i + 1; j < 10; j++) {
      if (buf[i] > buf[j]) {
        temp = buf[i];
        buf[i] = buf[j];
        buf[j] = temp;
      }
    }
  }
  avgValue = 0;
  for (int i = 2; i < 8; i++)  //pegue o valor médio de 6 amostras de centro
    avgValue += buf[i];
  float phValue = (float)avgValue * 3.3 / 1023 / 6;  //converter o analógico em milivolt
  phValue = 3.5 * phValue;                           //converter o milivolt em valor de pH
  Serial.print("    pH:");
  Serial.print(phValue, 2);
  Serial.println(" ");
  return phValue;
}

void tryConnect() {
  bool connected = client.connect(websockets_server_host, websockets_server_port, "/");
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