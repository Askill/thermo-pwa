const dbconnect = window.indexedDB.open('temps', 1);
var db = null

const interval = setInterval(writeTo, 5000);


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
      let time = date.getTime()
      let writeData = [
        {timestamp: time, temp: data["temperature"]}
      ];

      write("Temperatures", writeData)

      writeData = [
        {timestamp: time, temp: data["humidity"]}
      ];

      write("Humidities", writeData)
    },
    function(){
        console.log("Error while getting temps")
    }
  );

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


function readLast(n){
  let objectStore = db.transaction("Temperatures").objectStore("Temperatures");
  let data = [];

  objectStore.openCursor(null, "prev").onsuccess = function(event) {
    var cursor = event.target.result;
    if (cursor && data.length < n) {
      //console.log(cursor.value);
      data.push(cursor.value)
      cursor.continue();
    }
  };
  return data
}