const dbconnect = window.indexedDB.open('temps', 1);
var db = null
var n = 50
const interval = setInterval(writeTo, 3000);


dbconnect.onupgradeneeded = ev => {
  console.log('Upgrade DB');
  const db = ev.target.result;
  let store = db.createObjectStore('Temperatures', { keyPath: 'timestamp'});
  store.createIndex("timestamp", "timestamp", { unique: false });
  store.createIndex("temp", "temp", { unique: false });

  store = db.createObjectStore('Humidities', { keyPath: 'timestamp'});
  store.createIndex("timestamp", "timestamp", { unique: false });
  store.createIndex("humidity", "humidity", { unique: false });
}


dbconnect.onsuccess = ev => {
  console.log('DB-Upgrade erfolgreich');
  db = ev.target.result;

}

function write(type, data){
  const transaction = db.transaction(type, 'readwrite');
  const store = transaction.objectStore(type);

  data.forEach(el => store.add(el));

  transaction.onerror = ev => {
    console.error('Ein Fehler ist aufgetreten!', ev.target.error.message);
  };

  transaction.oncomplete = ev => {
    //console.log('Daten wurden erfolgreich hinzugefügt! ' + type);
    const store = db.transaction(type, 'readonly').objectStore(type);
    //const query = store.get(1); // Einzel-Query
    const query = store.openCursor()
    query.onerror = ev => {
      console.error('Anfrage fehlgeschlagen!', ev.target.error.message);
    };

    query.onsuccess = ev => {
      
    };
  };
}

function writeTo(){

  getJSON("/stats",
    function (error, data) {
      let date = new Date()
      let time = date.toLocaleString()
      let writeData = [
        {timestamp: time, temperature: data["temperature"]}
      ];

      write("Temperatures", writeData)

      writeData = [
        {timestamp: time, humidity: data["humidity"]}
      ];

      write("Humidities", writeData)
    },
    function(){
        console.log("Error while getting temps")
    }
  );

    drawChart()

}

function drawChart(){

  

  chart1.data.datasets[0].data = chart1.data.datasets[0].data.slice(-n)
  chart1.data.datasets[1].data = chart1.data.datasets[1].data.slice(-n)
  chart1.data.labels = chart1.data.labels.slice(-n)


  readLast("Humidities", n, function(data){
    data.reverse().forEach(function(item){
      chart1.data.datasets[0].data.push(item["humidity"])
      chart1.data.labels.push(item["timestamp"]) 
    })

  })
  readLast("Temperatures", n, function(data){
    data.reverse().forEach(function(item){
      chart1.data.datasets[1].data.push(item["temperature"])
    })
  })

  chart1.update()
}

// TODO: replace with fetch
function getJSON(url, callback, fallback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.onload = function () {
      var status = xhr.status;
      if (status < 400) {
          callback(null, xhr.response);
      } else {
          fallback();
      }
  };
  xhr.send();
};

  //https://www.chartjs.org/docs/latest/developers/updates.html
  var chart1 = new Chart(document.getElementById("line-chart"), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{ 
          data: [],
          label: "Humidity",
          borderColor: "blue",
          fill: false
        },
        { 
          data: [],
          label: "Temperature",
          borderColor: "red",
          fill: false
        }
      ]
    },
    options: {
      responsive: false,
      width:1000,
      height:800,
      title: {
        display: true,
        text: 'Climate'
      }
    }
  });

function readLast(type, n, callback){
  let objectStore = db.transaction(type).objectStore(type);
  let data = [];

  objectStore.openCursor(null, "prev").onsuccess = function(event) {
    var cursor = event.target.result;
    if (cursor && data.length < n) {
      try {
        data.push(cursor.value)

        cursor.continue();
      } catch (error) {
        console.log(error)
      }
    }
    else{
      callback(data)
    }
  };

}