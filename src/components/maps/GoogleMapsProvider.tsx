/**
 * Google Maps API Provider
 *
 * Wraps the app with Google Maps API context
 * Provides the API key and loads the Maps JavaScript API
 */

import { APIProvider } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCe8TlrQ6LjT9vq9Awv0aS91ZxVosaRyJE';

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      {children}
    </APIProvider>
  );
}
