// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import Profile from './src/screens/Profile';

const Stack = createNativeStackNavigator();

export default function App() {
  const [auth, setAuth] = useState(null);

  useEffect(() => { AsyncStorage.getItem('access').then(setAuth); }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {auth ? (
          <Stack.Screen name="Profile">
            {(props) => (
              <Profile
                {...props}
                onLogout={async () => {
                  await AsyncStorage.multiRemove(['access','refresh']);
                  setAuth(null);
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Login">
              {(props) => <Login {...props} onAuth={setAuth} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => <Register {...props} onAuth={setAuth} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
