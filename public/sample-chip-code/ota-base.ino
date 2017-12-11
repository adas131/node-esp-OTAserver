#include "FS.h"
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ESP8266httpUpdate.h>

int _versionNum = 5;
bool _hasAPrunning;
bool _hasWiFiconnected;
int _numWiFiAttempts;
int _resetTime = 0;
int _updateTime = 0;
ESP8266WebServer server(80);

void normalSetup()
{
    //  Put your normal setup code in here
}

void normalLoop()
{
    //  Put your normal loop code in here
}

void setup()
{
    startSerial();
    WiFi.persistent(false);
    _hasAPrunning = false;
    doSpiffyStuff();
    normalSetup();
}

void printVersionNumber()
{
    Serial.print("Version:");
    char tmp[10];
    Serial.println(itoa(_versionNum, tmp, 10));
}

void loop()
{
    if (_hasAPrunning)
    {
        if (_resetTime > 0 && millis() > _resetTime)
        {
            Serial.println("_resetTime");
            Serial.println(_resetTime);
            Serial.println("uptime");
            Serial.println(millis());
            restart();
        }
        server.handleClient();
    }
    else if (!_hasWiFiconnected)
    {
        restart();
    }
    else
    {
        if (WiFi.status() != WL_CONNECTED)
        {
            restart();
        }
        checkUpdate();
    }
    normalLoop();
}

void checkUpdate()
{
    if (_updateTime > 0 && millis() > _updateTime)
    {
        Serial.println("_updateTime");
        Serial.println(_updateTime);
        Serial.println("uptime");
        Serial.println(millis());
        tryUpdate();
    }
    else if (millis() == 0)
    {
        restart();
    }
}

void startSerial()
{
    Serial.begin(115200);
    Serial.println("Booted: " + String(ESP.getChipId(), HEX));
}

void doSpiffyStuff()
{
    startSPIFFS();
    if (SPIFFShasFiles())
    {
        readSPIFFSwifiNumAttempts();
        readSPIFFSwifi();
        if (_hasWiFiconnected)
        {
            tryUpdate();
        }
        else
        {
            startWebConfig(true);
        }
    }
    else
    {
        startWebConfig(false);
    }
}

void tryUpdate()
{
    Serial.println("Checking for updates");
    String updateServer = "http://update.server.fqdn";
    String url = updateServer + "/getupdate/" + String(ESP.getChipId(), HEX) + "/file.bin";
    t_httpUpdate_return ret = ESPhttpUpdate.update(url);
    switch (ret)
    {
    case HTTP_UPDATE_FAILED:
        Serial.printf("HTTP_UPDATE_FAILED Error (%d): %s\n", ESPhttpUpdate.getLastError(), ESPhttpUpdate.getLastErrorString().c_str());
        break;

    case HTTP_UPDATE_NO_UPDATES:
        Serial.println("HTTP_UPDATE_NO_UPDATES");
        break;

    case HTTP_UPDATE_OK:
        Serial.println("HTTP_UPDATE_OK");
        restart();
        break;
    }
    _resetTime = millis() + 1000 * 600;
}

void writeSPIFFSwifiNumAttempts(int numAttempts)
{
    // open file for writing
    Serial.println("====== Writing to SPIFFS number of attempts file =======");
    File f = SPIFFS.open("/wifi/attempts.txt", "w");
    if (!f)
    {
        Serial.println("file open failed");
    }
    char tmp[10];
    f.println(itoa(numAttempts, tmp, 10));
    f.close();
}

void writeSPIFFSwifi(String ssid, String password)
{
    // open file for writing
    Serial.println("====== Writing to SPIFFS file =======");
    File f = SPIFFS.open("/wifi/config.txt", "w");
    if (!f)
    {
        Serial.println("file open failed");
    }
    f.println(ssid);
    f.println(password);
    f.close();
}

void readSPIFFSwifiNumAttempts()
{
    // open file for reading
    File f = SPIFFS.open("/wifi/attempts.txt", "r");
    if (!f)
    {
        Serial.println("file open failed");
    }
    Serial.println("====== Reading from SPIFFS number of attempts file =======");
    int numAttempts;
    String s = f.readStringUntil('\n');
    numAttempts = atoi(s.c_str());
    Serial.print("numAttempts:");
    Serial.println(s);
    _numWiFiAttempts = numAttempts;
}

void readSPIFFSwifi()
{
    // open file for reading
    File f = SPIFFS.open("/wifi/config.txt", "r");
    if (!f)
    {
        Serial.println("file open failed");
    }
    Serial.println("====== Reading from SPIFFS file =======");
    String ssid = "";
    String password = "";
    for (int i = 1; i <= 2; i++)
    {
        String s = f.readStringUntil('\n');
        Serial.print(i);
        if (i == 1)
        {
            ssid = s;
            Serial.print("SSID");
            Serial.print(":");
            Serial.println(s);
        }
        else
        {
            password = s;
            //      Serial.print("Password");
            //      Serial.print(":");
            //      Serial.println(s);
        }
    }
    connectWiFi(ssid, password);
}

void connectWiFi(String ssid, String password)
{
    ssid.trim();
    password.trim();
    bool foundConnection = false;
    auto apListLength = WiFi.scanNetworks();
    for (int i = 0; i < apListLength; i++)
    {
        Serial.println(ssid);
        if (WiFi.SSID(i) == ssid)
        {
            Serial.println();
            Serial.printf("Found the connection! %s\n", WiFi.SSID(i).c_str());
            foundConnection = true;
        }
    }
    if (foundConnection)
    {
        if (password.length() > 0)
        {
            WiFi.begin(ssid.c_str(), password.c_str());
        }
        else
        {
            WiFi.begin(ssid.c_str());
        }
        Serial.println("Connecting");

        int retryCount = 0;
        while (WiFi.status() != WL_CONNECTED && retryCount < 25)
        {
            retryCount += 1;
            delay(500);
            Serial.print(".");
        }
        if (WiFi.status() == WL_CONNECTED)
        {
            Serial.println("Connected, IP address: ");
            Serial.println(WiFi.localIP());
            _hasWiFiconnected = true;
        }
        else
        {
            Serial.println("Connection failed.");
            _hasWiFiconnected = false;
            delay(5000);
        }
    }
    else
    {
        Serial.println("Didn't find our SSID");
        delay(5000);
        if (_numWiFiAttempts >= 2)
        {
            writeSPIFFSwifiNumAttempts(0);
            startWebConfig(true);
        }
        else
        {
            writeSPIFFSwifiNumAttempts(_numWiFiAttempts + 1);
            restart();
        }
    }
}

void startSPIFFS()
{
    SPIFFS.begin();
    Serial.println("Spiffs started");
}
void formatSPIFFS()
{
    SPIFFS.format();
    Serial.println("Spiffs formatted");
}

bool SPIFFShasFiles()
{
    Dir dir = SPIFFS.openDir("/");
    return dir.next();
}

void startWebConfig(bool shouldReset)
{
    if (shouldReset)
    {
        _resetTime = millis() + 1000 * 120;
    }
    String APName = String(ESP.getChipId(), HEX);
    APName += "_Config";
    WiFi.softAP(APName.c_str());
    Serial.printf("AP started: %s\n", APName.c_str());
    _hasAPrunning = true;
    Serial.println(WiFi.softAPIP());
    setupWebServer();
}

void setupWebServer()
{
    server.on("/", handleRoot);
    server.on("/setwifi", handlesetwifi);
    server.onNotFound(handleNotFound);
    server.begin();
    Serial.println("Server started");
}

void handlesetwifi()
{
    char temp[500];

    snprintf(temp, 500,

             "<html>\
  <head>\
    <title>WifiConfig</title>\
    <style>\
      body { background-color: #cccccc; font-family: Arial, Helvetica, Sans-Serif; Color: #000088; }\
    </style>\
  </head>\
  <body onload='gohome()'>\
    Got it! If this WiFi disappears, I've connected successfully.\
    <script>function gohome() {\
      setTimeout(() => {\
        window.location = '/';\
      },10000);\
    }</script>\
  </body>\
</html>");
    server.send(200, "text/html", temp);
    formatSPIFFS();
    String val1 = server.arg("SSID");
    String val2 = server.arg("Password");
    Serial.println(val1);
    Serial.println(val2);
    Serial.println("Responded to /setwifi");
    WiFi.softAPdisconnect(true);
    writeSPIFFSwifi(val1, val2);
    restart();
}

void handleRoot()
{
    char temp[600];

    snprintf(temp, 600,

             "<html>\
  <head>\
    <title>WifiConfig</title>\
    <style>\
      body { background-color: #cccccc; font-family: Arial, Helvetica, Sans-Serif; Color: #000088; }\
    </style>\
  </head>\
  <body>\
    <form method='POST' action='/setwifi'>\
    <input type='text' placeholder='SSID' name='SSID'>\
    <br>\
    <input type='text' placeholder='Password' name='Password'>\
    <br>\
    <input type='submit' value='   GO!   '>\
    </form>\
  </body>\
</html>");
    server.send(200, "text/html", temp);
    Serial.println("Responded to /");
}

void handleNotFound()
{
    String message = "File Not Found\n\n";
    message += "URI: ";
    message += server.uri();
    message += "\nMethod: ";
    message += (server.method() == HTTP_GET) ? "GET" : "POST";
    message += "\nArguments: ";
    message += server.args();
    message += "\n";

    for (uint8_t i = 0; i < server.args(); i++)
    {
        message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
    }

    server.send(404, "text/plain", message);
}

void restart()
{
    delay(100);
    ESP.restart();
}
