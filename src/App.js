import { useEffect, useRef, useState } from 'react';
import * as tt from '@tomtom-international/web-sdk-maps'
import * as ttapi from '@tomtom-international/web-sdk-services'
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

  const convertToPoints = (lngLat) => {
    return {
      point: {
        longitude: lngLat.lng,
        latitude: lngLat.lat
      }
    }
  }

  const drawRoute = (geoJson, map) => {
    if (map.getLayer('route')) {
      map.removeLayer('route')
      map.removeSource('route')
    }
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geoJson
      },
      paint: {
        'line-color': 'red',
        'line-width': 6
      }
    })
  }

  const addDeliveryMarker = (lngLat, map) => {
    const popupOffset = {
      bottom: [0, -35]
    }
    const popup = new tt.Popup({ offset: popupOffset }).setHTML('To Deliver!')

    const marker = new tt.Marker()
      .setLngLat(lngLat)
      .addTo(map)

    marker.setPopup(popup).togglePopup()
  }

  useEffect(() => {
    const origin = {
      lng: longitude,
      lat: latitude
    }
    const destinations = []

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
      const popupOffset = {
        bottom: [0, -35]
      }
      const popup = new tt.Popup({ offset: popupOffset }).setHTML('This is you!')

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

      marker.setPopup(popup).togglePopup()
    }

    addMarker()

    const sortDestinations = (locations) => {
      const pointsForDestinations = locations.map(destination => convertToPoints(destination))

      const callParameters = {
        key: process.env.REACT_APP_TOM_TOM_API_KEY,
        destinations: pointsForDestinations,
        origins: [convertToPoints(origin)]
      }

      return new Promise((resolve, reject) => {
        ttapi.services
          .matrixRouting(callParameters)
          .then(matrixAPIResults => {
            const results = matrixAPIResults.matrix[0]
            const resultsArray = results.map((result, index) => {
              return {
                location: locations[index],
                drivingTime: result.response.routeSummary.travelTimeInSeconds
              }
            })

            resultsArray.sort((a, b) => {
              return a.drivingTime - b.drivingTime
            })
            const sortedLocations = resultsArray.map(result => {
              return result.location
            })
            resolve(sortedLocations)
          })
      })
    }

    const recalculateRoutes = () => {
      sortDestinations(destinations).then(sorted => {
        sorted.unshift(origin)

        ttapi.services
          .calculateRoute({
            key: process.env.REACT_APP_TOM_TOM_API_KEY,
            locations: sorted
          })
          .then(routeData => {
            const geoJson = routeData.toGeoJson()
            drawRoute(geoJson, map)
          })
      })
    }


    map.on('click', (e) => {
      destinations.push(e.lngLat)
      addDeliveryMarker(e.lngLat, map)
      recalculateRoutes()
    })

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
