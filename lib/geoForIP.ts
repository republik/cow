import geoipDatabase from 'geoip-database'
import maxmind from 'maxmind'
let cityLookup

const geoForIP = async (ip: string) => {
  if (!cityLookup) {
    cityLookup = await maxmind.open(geoipDatabase.city)
  }

  const geo = cityLookup.get(ip)
  let country
  // eslint-disable-next-line no-empty
  try {
    country = geo.country.names.de
  } catch (e) {}
  let countryEN
  // eslint-disable-next-line no-empty
  try {
    countryEN = geo.country.names.en
  } catch (e) {}
  let city
  // eslint-disable-next-line no-empty
  try {
    city = geo.city.names.de
  } catch (e) {}
  return { country, countryEN, city }
}

export default geoForIP
