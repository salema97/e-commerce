import { Redirect } from 'expo-router';

export default function WishlistRedirect(): React.ReactElement {
  return <Redirect href="/(tabs)/wishlist" />;
}
