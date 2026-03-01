import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// 导入屏幕
import EarthquakeScreen from './src/screens/EarthquakeScreen';
import JournalScreen from './src/screens/JournalScreen';
import KnowledgeScreen from './src/screens/KnowledgeScreen';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === '地震分布') {
              iconName = focused ? 'earth' : 'earth-outline';
            } else if (route.name === '期刊论文') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === '学者信息') {
              iconName = focused ? 'people' : 'people-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#F2F2F7',
            borderTopColor: '#E5E5EA',
            borderTopWidth: 0.5,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: '#F2F2F7',
            borderBottomColor: '#E5E5EA',
            borderBottomWidth: 0.5,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#000',
          },
        })}
      >
        <Tab.Screen 
          name="地震分布" 
          component={EarthquakeScreen} 
          options={{ title: '地震分布' }}
        />
        <Tab.Screen 
          name="期刊论文" 
          component={JournalScreen} 
          options={{ title: '期刊论文' }}
        />
        <Tab.Screen 
          name="学者信息" 
          component={KnowledgeScreen} 
          options={{ title: '学者信息' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;