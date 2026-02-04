import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  StoryDetail: { clusterId: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}
