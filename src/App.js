import { useEffect, useRef, useState } from 'react';
import * as tt from '@tomtom-international/web-sdk-maps'
import './App.css'
import '@tomtom-international/web-sdk-maps/dist/maps.css'

import TextField from '@material-ui/core/TextField';
import PersonPinCircleIcon from '@material-ui/icons/PersonPinCircle';


function App() {
  const mapElement = useRef()
  const [map, setMap] = useState({})
  const [longitude, setLongitude] = useState(-0.34675)
  const [latitude, setLatitude] = useState(51.46664)

  const handleLongitude = (event) => setLongitude(event.target.value)
  const handleLatitude = (event) => setLatitude(event.target.value)

  useEffect(() => {
    let map = tt.map({
      key: process.env.REACT_APP_TOM_TOM_API_KEY,
      container: mapElement.current,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true
      },
      center: [longitude, latitude],
      zoom: 14
    })

    setMap(map)

    const addMarker = () => {

      const marker = new tt.Marker({
        draggable: true,
        // element: <PersonPinCircleIcon />,

      })
        .setLngLat([longitude, latitude])
        .addTo(map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        setLongitude(lngLat.lng)
        setLatitude(lngLat.lat)
      })
    }

    addMarker()

    return () => map.remove()

  }, [latitude, longitude])

  return (
    <div className="app">
      <div ref={mapElement} className="map"></div>
      <div>
        <TextField
          label="Longitude"
          id="longitude"
          onChange={handleLongitude}
          value={longitude || ''}
        />

        <TextField
          label="Latitude"
          id="latitude"
          onChange={handleLatitude}
          value={latitude || ''}
        />
      </div>
    </div>
  )

}

export default App
