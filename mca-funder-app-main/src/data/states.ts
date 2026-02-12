export interface State {
  name: string;
  cities: string[];
}

export const states: State[] = [
  {
    name: 'Alabama',
    cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa']
  },
  {
    name: 'Alaska',
    cities: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan']
  },
  {
    name: 'Arizona',
    cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale']
  },
  {
    name: 'Arkansas',
    cities: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro']
  },
  {
    name: 'California',
    cities: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno']
  },
  {
    name: 'Colorado',
    cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood']
  },
  {
    name: 'Connecticut',
    cities: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury']
  },
  {
    name: 'Delaware',
    cities: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna']
  },
  {
    name: 'Florida',
    cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg']
  },
  {
    name: 'Georgia',
    cities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens']
  },
  {
    name: 'Hawaii',
    cities: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu']
  },
  {
    name: 'Idaho',
    cities: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello']
  },
  {
    name: 'Illinois',
    cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville']
  },
  {
    name: 'Indiana',
    cities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel']
  },
  {
    name: 'Iowa',
    cities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City']
  },
  {
    name: 'Kansas',
    cities: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe']
  },
  {
    name: 'Kentucky',
    cities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington']
  },
  {
    name: 'Louisiana',
    cities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles']
  },
  {
    name: 'Maine',
    cities: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn']
  },
  {
    name: 'Maryland',
    cities: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie']
  },
  {
    name: 'Massachusetts',
    cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell']
  },
  {
    name: 'Michigan',
    cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor']
  },
  {
    name: 'Minnesota',
    cities: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington']
  },
  {
    name: 'Mississippi',
    cities: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi']
  },
  {
    name: 'Missouri',
    cities: ['Kansas City', 'Saint Louis', 'Springfield', 'Independence', 'Columbia']
  },
  {
    name: 'Montana',
    cities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte']
  },
  {
    name: 'Nebraska',
    cities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney']
  },
  {
    name: 'Nevada',
    cities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks']
  },
  {
    name: 'New Hampshire',
    cities: ['Manchester', 'Nashua', 'Concord', 'Dover', 'Rochester']
  },
  {
    name: 'New Jersey',
    cities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison']
  },
  {
    name: 'New Mexico',
    cities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell']
  },
  {
    name: 'New York',
    cities: ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse']
  },
  {
    name: 'North Carolina',
    cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem']
  },
  {
    name: 'North Dakota',
    cities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo']
  },
  {
    name: 'Ohio',
    cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron']
  },
  {
    name: 'Oklahoma',
    cities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton']
  },
  {
    name: 'Oregon',
    cities: ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro']
  },
  {
    name: 'Pennsylvania',
    cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading']
  },
  {
    name: 'Rhode Island',
    cities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence']
  },
  {
    name: 'South Carolina',
    cities: ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill']
  },
  {
    name: 'South Dakota',
    cities: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown']
  },
  {
    name: 'Tennessee',
    cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville']
  },
  {
    name: 'Texas',
    cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth']
  },
  {
    name: 'Utah',
    cities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem']
  },
  {
    name: 'Vermont',
    cities: ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier']
  },
  {
    name: 'Virginia',
    cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News']
  },
  {
    name: 'Washington',
    cities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue']
  },
  {
    name: 'West Virginia',
    cities: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling']
  },
  {
    name: 'Wisconsin',
    cities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine']
  },
  {
    name: 'Wyoming',
    cities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs']
  }
]; 