//서버 오픈하는 문법
const express = require('express'); //설치한 라이브러리 첨부
const app = express(); //라이브러리를 이용해서 새로운 객체 생성
const bodyParser = require('body-parser'); //데이터 서버에 전송
const { application } = require('express');
app.use(bodyParser.urlencoded({extended : true}))
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
const methodOverride = require('method-override')
app.use(methodOverride('_method'));


app.use('/public', express.static('public'));  //css

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
    응답.render('index.ejs');
})
  
app.get('/write', function(요청, 응답) { 
    응답.render('write.ejs')
});
  
//    app.post('/add', function(요청, 응답){
//        console.log(요청.body);
//        응답.send('전송완료')
//    });

app.post('/add', function(요청, 응답){
    응답.send('전송완료');
    db.collection('counter').findOne({name : '게시물갯수'}, function(에러,결과){
        if(에러) {return console.log(에러)};
        console.log(요청.body.title);
        console.log(요청.body.date);
        console.log(결과.totalPost); //findOne으로 가져온 데이터 중 totalPost 이름을 가진 데이터를 출력

        var 총게시물갯수 = 결과.totalPost; //총게시물갯수 라는 변수에 결과.totalPost를 저장 

        db.collection('post').insertOne({_id : 총게시물갯수 + 1, 제목 : 요청.body.title, 날짜 : 요청.body.date} , function(에러, 결과){
            if(에러) {return console.log(에러)};
            console.log('저장 완료');
            //counter라는 콜렉션에 있는 totalPost라는 항목도 1 증가(로 수정한다)
            db.collection('counter').updateOne({name:'게시물갯수'}, {$inc : {totalPost : 1 }}, function(에러, 결과){
                if(에러){return console.log(에러)};
                console.log('totalPost 증가 완료');
            });
        });      
    });
});

//글 번호 달기


//서버에서 .html 말고 .ejs 파일 보내기
app.get('/list',function(요청, 응답){
    //db에 저장된 모든 데이터 가져오기, 메타데이터 포함.
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
        //가져온 데이터를 ejs 파일에 넣는다
        응답.render('list.ejs',{posts : 결과});
    }); 
});


app.delete('/delete', function(요청, 응답){
    console.log(요청.body._id); //delete 요청할 때 같이 보낸 데이터
    요청.body._id = parseInt(요청.body._id); //'1'이라는 문자를 정수로 변환
    //요청.body에 담긴 게시물 번호에 따라 DB에서 게시물 삭제
    db.collection('post').deleteOne(요청.body, function(에러, 결과){
        if(에러){return console.log(에러)};
        //delete 성공했을 때 
        console.log('삭제 완료');
        응답.status(200).send({message : '성공했습니다.'});
    })
});

app.get('/detail/:id', function(요청, 응답){
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        응답.render('detail.ejs', {data : 결과})
    });
})

  
app.get('/edit/:id', function(요청, 응답) {
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        응답.render('edit.ejs', {post : 결과}); 
    });
});

app.put('/edit', function(요청, 응답){
    db.collection('post').updateOne({_id : parseInt(요청.body.id)},{ $set : {제목 : 요청.body.title, 날짜 : 요청.body.date} },function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        console.log('수정 완료');
        응답.redirect('/list')
    })
});
