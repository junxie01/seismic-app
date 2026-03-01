#!/bin/bash

# 启动Expo开发服务器并切换到Expo Go模式
npx expo start --port 8084 | while read line; do
  echo "$line"
  # 检查是否出现提示，然后发送 's' 来切换到Expo Go
  if [[ "$line" == *"Press s │ switch to Expo Go"* ]]; then
    sleep 2
    echo 's' > /proc/$$/fd/0
  fi
done
