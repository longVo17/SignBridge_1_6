import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, createNavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

export const navigationRef = createNavigationContainerRef();
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

// Firebase auth listener
import { subscribeToAuthState, configureGoogleSignIn } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { AuthUser } from '../types/auth.types';
import { notificationService } from '../services/notification.service';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import { LearningPathScreen } from '../screens/LearningPathScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { DictionaryScreen } from '../screens/DictionaryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { TranslationScreen } from '../screens/TranslationScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { FlashCardReviewScreen } from '../screens/FlashCardReviewScreen';
import LessonSummaryScreen from '../screens/LessonSummaryScreen';
import FlashCardSummaryScreen from '../screens/FlashCardSummaryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Height of the floating tab bar + its bottom margin + extra breathing room
export const TAB_BAR_HEIGHT = 54;
export const TAB_BAR_BOTTOM = 10;
export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM + 6;

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Learn') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Practice') iconName = focused ? 'videocam' : 'videocam-outline';
          else if (route.name === 'Translate') iconName = focused ? 'scan' : 'scan-outline';
          else if (route.name === 'Dictionary') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={focused ? 20 : 18} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          position: 'absolute',
          bottom: TAB_BAR_BOTTOM,
          left: 16,
          right: 16,
          height: TAB_BAR_HEIGHT,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 1.5,
              borderColor: 'rgba(45, 199, 255, 0.15)',
            }}
          />
        ),
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 8.5,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearningPathScreen} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
      <Tab.Screen name="Translate" component={TranslationScreen} />
      <Tab.Screen name="Dictionary" component={DictionaryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { status, setUser, setStatus } = useAuthStore();

  // Subscribe to Firebase auth state on app mount
  useEffect(() => {
    configureGoogleSignIn();
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(authUser);

        // Register device notifications and schedule local reminders
        notificationService.registerForPushNotifications(firebaseUser.uid)
          .then(() => notificationService.scheduleDailyReminder())
          .catch(err => console.warn("Failed to init push notifications:", err));
      } else {
        setUser(null);
      }
      // Remove loading state after first check
      if (status === 'loading') setStatus(firebaseUser ? 'authenticated' : 'unauthenticated');
    });

    // Listen to notification clicks (tap response) to deep link to Notifications screen
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      setTimeout(() => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('Notifications' as never);
        }
      }, 300);
    });

    return () => {
      unsubscribe();
      responseSubscription.remove();
    };
  }, []);

  // Show spinner while Firebase checks persisted session
  if (status === 'loading') return <LoadingScreen />;

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F9F9F9',
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {status === 'authenticated' ? (
          // Authenticated routes
          <>
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
            <Stack.Screen name="Lesson" component={LessonScreen} />
            <Stack.Screen name="FlashCardReview" component={FlashCardReviewScreen} />
            <Stack.Screen name="LessonSummary" component={LessonSummaryScreen} />
            <Stack.Screen name="FlashCardSummary" component={FlashCardSummaryScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        ) : (
          // Unauthenticated routes
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
