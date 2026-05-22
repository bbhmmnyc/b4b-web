// 30 iconic city backgrounds from around the globe
// Homepage always shows index 0 (Statue of Liberty)
// Other pages pick a random city on each navigation

const cityBackgrounds = [
  { city: "New York City", landmark: "Statue of Liberty", country: "USA", image: "https://images.unsplash.com/photo-1583707225662-125fe69e6656?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxzdGF0dWUlMjBvZiUyMGxpYmVydHklMjBuZXclMjB5b3JrJTIwY2l0eXxlbnwwfHx8fDE3NzUwNjMzNjN8MA&ixlib=rb-4.1.0&q=85" },
  { city: "Seattle", landmark: "Space Needle", country: "USA", image: "https://images.pexels.com/photos/1796730/pexels-photo-1796730.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Mount Fuji", landmark: "Mount Fuji", country: "Japan", image: "https://images.unsplash.com/photo-1681123079018-8ab2d753bfbc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxtb3VudCUyMGZ1amklMjBqYXBhbiUyMHNjZW5pY3xlbnwwfHx8fDE3NzUwNjMzNjV8MA&ixlib=rb-4.1.0&q=85" },
  { city: "Paris", landmark: "Eiffel Tower", country: "France", image: "https://images.unsplash.com/photo-1570097703229-b195d6dd291f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxlaWZmZWwlMjB0b3dlciUyMHBhcmlzfGVufDB8fHx8MTc3NTA2MzM2Nnww&ixlib=rb-4.1.0&q=85" },
  { city: "London", landmark: "Big Ben", country: "UK", image: "https://images.unsplash.com/photo-1600682111749-2456071bf366?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxiaWclMjBiZW4lMjBsb25kb24lMjBsYW5kbWFya3xlbnwwfHx8fDE3NzUwNjMzNjd8MA&ixlib=rb-4.1.0&q=85" },
  { city: "Sydney", landmark: "Opera House", country: "Australia", image: "https://images.pexels.com/photos/32329073/pexels-photo-32329073.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Rome", landmark: "Colosseum", country: "Italy", image: "https://images.pexels.com/photos/36581129/pexels-photo-36581129.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Agra", landmark: "Taj Mahal", country: "India", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHx0YWolMjBtYWhhbCUyMGluZGlhfGVufDB8fHx8MTc3NTA2MzM3OXww&ixlib=rb-4.1.0&q=85" },
  { city: "Beijing", landmark: "Great Wall", country: "China", image: "https://images.pexels.com/photos/9274494/pexels-photo-9274494.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Rio de Janeiro", landmark: "Christ the Redeemer", country: "Brazil", image: "https://images.unsplash.com/photo-1599128971079-281d0da05544?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwxfHxjaHJpc3QlMjByZWRlZW1lciUyMHJpbyUyMGphbmVpcm98ZW58MHx8fHwxNzc1MDYzMzgwfDA&ixlib=rb-4.1.0&q=85" },
  { city: "Dubai", landmark: "Burj Khalifa", country: "UAE", image: "https://images.unsplash.com/photo-1651063820152-d3e7a27b4d2b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxkdWJhaSUyMGJ1cmolMjBraGFsaWZhJTIwc2t5bGluZXxlbnwwfHx8fDE3NzUwNjMzODB8MA&ixlib=rb-4.1.0&q=85" },
  { city: "San Francisco", landmark: "Golden Gate Bridge", country: "USA", image: "https://images.unsplash.com/photo-1664321074723-34d76a5b818c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjBnYXRlJTIwYnJpZGdlJTIwc2FuJTIwZnJhbmNpc2NvfGVufDB8fHx8MTc3NTA2MzM4MXww&ixlib=rb-4.1.0&q=85" },
  { city: "Cusco", landmark: "Machu Picchu", country: "Peru", image: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwxfHxtYWNodSUyMHBpY2NodSUyMHBlcnV8ZW58MHx8fHwxNzc1MDYzMzgyfDA&ixlib=rb-4.1.0&q=85" },
  { city: "Santorini", landmark: "Blue Domes", country: "Greece", image: "https://images.pexels.com/photos/2291340/pexels-photo-2291340.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Tokyo", landmark: "Tokyo Tower", country: "Japan", image: "https://images.pexels.com/photos/31258209/pexels-photo-31258209.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Giza", landmark: "Great Pyramids", country: "Egypt", image: "https://images.pexels.com/photos/36505454/pexels-photo-36505454.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Venice", landmark: "Grand Canal", country: "Italy", image: "https://images.unsplash.com/photo-1664471994229-d328ae642328?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHx2ZW5pY2UlMjBjYW5hbCUyMGdvbmRvbGElMjBpdGFseXxlbnwwfHx8fDE3NzUwNjMzOTZ8MA&ixlib=rb-4.1.0&q=85" },
  { city: "Hong Kong", landmark: "Victoria Harbour", country: "China", image: "https://images.pexels.com/photos/10563509/pexels-photo-10563509.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Istanbul", landmark: "Blue Mosque", country: "Turkey", image: "https://images.unsplash.com/photo-1609518624785-dd9d1d436d1c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxpc3RhbmJ1bCUyMGJsdWUlMjBtb3NxdWUlMjB0dXJrZXl8ZW58MHx8fHwxNzc1MDYzMzk4fDA&ixlib=rb-4.1.0&q=85" },
  { city: "Petra", landmark: "The Treasury", country: "Jordan", image: "https://images.pexels.com/photos/24973219/pexels-photo-24973219.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Siem Reap", landmark: "Angkor Wat", country: "Cambodia", image: "https://images.pexels.com/photos/19142378/pexels-photo-19142378.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Toronto", landmark: "CN Tower", country: "Canada", image: "https://images.pexels.com/photos/6489450/pexels-photo-6489450.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Berlin", landmark: "Brandenburg Gate", country: "Germany", image: "https://images.pexels.com/photos/32848467/pexels-photo-32848467.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Cape Town", landmark: "Table Mountain", country: "South Africa", image: "https://images.pexels.com/photos/8470660/pexels-photo-8470660.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Havana", landmark: "Old Havana", country: "Cuba", image: "https://images.pexels.com/photos/16386520/pexels-photo-16386520.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Amsterdam", landmark: "Canal Houses", country: "Netherlands", image: "https://images.pexels.com/photos/29080478/pexels-photo-29080478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Barcelona", landmark: "Sagrada Familia", country: "Spain", image: "https://images.pexels.com/photos/28785385/pexels-photo-28785385.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Moscow", landmark: "St. Basil's Cathedral", country: "Russia", image: "https://images.unsplash.com/photo-1661755905372-eea22765c203?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwxfHxtb3Njb3clMjBzdCUyMGJhc2lscyUyMGNhdGhlZHJhbCUyMHJlZCUyMHNxdWFyZXxlbnwwfHx8fDE3NzUwNjM0MjN8MA&ixlib=rb-4.1.0&q=85" },
  { city: "Singapore", landmark: "Marina Bay Sands", country: "Singapore", image: "https://images.pexels.com/photos/8176859/pexels-photo-8176859.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { city: "Prague", landmark: "Charles Bridge", country: "Czech Republic", image: "https://images.pexels.com/photos/16945287/pexels-photo-16945287.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
];

export default cityBackgrounds;
