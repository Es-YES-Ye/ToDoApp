//서버 오픈하는 문법
const express = require('express'); //설치한 라이브러리 첨부
const app = express(); //라이브러리를 이용해서 새로운 객체 생성
const bodyParser = require('body-parser'); //데이터 서버에 전송
app.use(bodyParser.urlencoded({extended : true}))
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://younsun0107:younsun0107@cluster0.bm2gs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',function(에러, client){
    //연결되면 할 일
    if(에러) return console.log(에러)
    db = client.db('todoapp'); //todoapp 이라는 데이터베이스폴더에 연결
//    db.collection('post').insertOne({이름 : '나나', 나이 : 20, _id : 100} , function(에러, 결과){
//        console.log('저장 완료');
//    }); //post라는 collection에 데이터 저장

    app.listen(8888, function(){
        console.log('listening on 8888')
    }); 
});


//두 개의 파라미터
app.get('/', function(요청, 응답) { 
    응답.sendFile(__dirname +'/index.html')
})
  
app.get('/write', function(요청, 응답) { 
    응답.sendFile(__dirname +'/write.html')
});
  
//    app.post('/add', function(요청, 응답){
//        console.log(요청.body);
//        응답.send('전송완료')
//    });

app.post('/add', function(요청, 응답){
    응답.send('전송완료')
    console.log(요청.body.title);
    console.log(요청.body.date);
    db.collection('post').insertOne({제목 : 요청.body.title, 날짜 : 요청.body.date} , function(에러, 결과){
        if(에러) return console.log(에러)
        console.log('저장 완료');
    });      
});

//서버에서 .html 말고 .ejs 파일 보내기
app.get('/list',function(요청, 응답){
    //db에 저장된 모든 데이터 가져오기, 메타데이터 포함.
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
        //가져온 데이터를 ejs 파일에 넣는다
        응답.render('list.ejs',{posts : 결과});
    }); 
});