#include <Servo.h>
#include <ArduinoJson.h>

const int size = 6;

Servo servos[size];
int pins[size] = { 3, 5, 6, 9, 10, 11 };

float startPositions[size] = {
  90, // hand
  0,  // twist
  0, // wrist
  0, // elbow
  140, // shoulder
  0   // rotate
};

float endPositions[size] = {
  180, // hand
  270, // twist
  90,  // wrist
  90, // elbow
  70, // shoulder
  180  // rotate
};

int percents[size] = { 50, 50, 50, 50, 50, 50 };

void move(int servoIndex, int percent) {
  percent = max(min(percent, 100), 0);

//  Serial.print("servoIndex=");
//  Serial.print(servoIndex);
//  Serial.print(" percent=");
//  Serial.print(percent);
//  float finalPosition = map(percent, 0, 100, startPositions[servoIndex], endPositions[servoIndex]);
//  Serial.print(" position=");
//  Serial.println(finalPosition);

  while(percents[servoIndex] != percent){
    // hand and twist can move faster
    if(servoIndex == 0 || servoIndex == 1){
      percents[servoIndex] = percent;
    } else {
      percents[servoIndex] += percents[servoIndex] > percent ? -1 : 1;
    }

    float position = map(percents[servoIndex], 0, 100, startPositions[servoIndex], endPositions[servoIndex]);
    //Serial.print(" position=");
    //Serial.println(position);
    delay(10);
    servos[servoIndex].write(position);
  }
}

String readLine() {
  //Serial.setTimeout(10000);
  String s;
  bool started = false;
  while(true) {
    int i = char(Serial.read());
    if (i>=0) {
      char c = char(i);
      if (c=='{') {
        started = true;
        s=c;
      }
      else if (c=='}') {
        if (started) {
          s+=c;
          return s;
        } else {
          s="";
          started=false;
        }
      } else {
        s+=c;
      }
    }
  }
}

StaticJsonDocument<1024> doc;
bool readJson() {
  String s = readLine();
  // Serial.println(s);

  if (s=="}") return false;
  DeserializationError err = deserializeJson(doc, s);

  if(err) {
    Serial.print("DeserializationError: ");
    Serial.println(err.c_str());
    return false;
  }

  return true;
}

void setup() {
  Serial.begin(9600);

  for (int i=0; i<6; i++){
    servos[i].attach(pins[i]);
    move(i, 0);
    delay(200);
    move(i, 50);
    delay(200);
    move(i, 100);
    delay(200);
    move(i, 50);
  }
}

char buff[75];
void loop() {
  sprintf(buff, "{hand:%d,twist:%d,wrist:%d,elbow:%d,shoulder:%d,rotate:%d}", percents[0], percents[1], percents[2], percents[3], percents[4], percents[5]);
  Serial.println(buff);
  if (readJson()) {
    if(doc.containsKey("hand"))     move(0, doc["hand"]);
    if(doc.containsKey("twist"))    move(1, doc["twist"]);
    if(doc.containsKey("wrist"))    move(2, doc["wrist"]);
    if(doc.containsKey("elbow"))    move(3, doc["elbow"]);
    if(doc.containsKey("shoulder")) move(4, doc["shoulder"]);
    if(doc.containsKey("rotate"))   move(5, doc["rotate"]);
  }
}
