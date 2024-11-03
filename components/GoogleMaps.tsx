const { compose, withProps } = require("recompose")
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker
} from "react-google-maps";

const MyMapComponent = compose(
  withProps({
    googleMapURL:
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyBMlpt09bXrwWTmiWO5D6AYbEP17mMBMvo&v=3.exp&libraries=geometry,drawing,places",
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `400px` }} />,
    mapElement: <div style={{ height: `100%` }} />
  }),
  withScriptjs,
  withGoogleMap
)((props:any) => {
  return (
  <GoogleMap defaultZoom={15} defaultCenter={{ lat: props?.lat, lng: props?.lng }}>
    <Marker position={{ lat: props?.lat, lng: props?.lng }} />
  </GoogleMap>
)});

// "https://maps.googleapis.com/maps/api/js?key=AIzaSyBMlpt09bXrwWTmiWO5D6AYbEP17mMBMvo&v=3.exp&libraries=geometry,drawing,places"

// https://maps.googleapis.com/maps/api/staticmap?center=40.714728,-73.998672&zoom=12&size=400x400&key=YOUR_API_KEY&signature=YOUR_SIGNATURE

export default MyMapComponent