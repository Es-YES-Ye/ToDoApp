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
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
require('dotenv').config();
const bcrypt = require('bcrypt');
const req = require('express/lib/request');
const flash = require('connect-flash/lib/flash');
const saltRounds =10;


app.use(session({
    secret : '비밀 코드',
    resave : true,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static('public'));  //css
//app.use(sessionMiddleware);
app.use(flash());

//몽고디비 연결
var db;
MongoClient.connect(process.env.DB_URL, function(err, client){
    if(err) return console.log(err)
    db = client.db('todoapp'); //todoapp 이라는 데이터베이스폴더에 연결
    //연결되면 출력
    app.listen(8888, function(){
        console.log('listening on 8888')
    }); 
});


//첫화면
app.get('/', function(요청, 응답) { 
    응답.render('index.ejs');
})
  
//글쓰기 버튼 눌렀을 때 글쓰기 페이지
app.get('/write', function(요청, 응답) { 
    응답.render('write.ejs')
});

//글쓰고 submit 했을 때 db에 저장
app.post('/add', function(요청, 응답){
    응답.send('전송완료');
    db.collection('counter').findOne({name : '게시물갯수'}, function(에러,결과){
        if(에러) {return console.log(에러)};
        console.log(요청.body.title);
        console.log(요청.body.date);
        console.log(결과.totalPost); //findOne으로 가져온 데이터 중 totalPost 이름을 가진 데이터를 출력
        //응답.redirect('/list')
        
        //글 번호 달아서 글 db에 넣기    
        var 총게시물갯수 = 결과.totalPost; //총게시물갯수 라는 변수에 결과.totalPost를 저장 
        
        db.collection('post').insertOne({_id : 총게시물갯수 + 1, 제목 : 요청.body.title, 날짜 : 요청.body.date, 메모 : 요청.body.memo} , function(에러, 결과){
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



//글목록에 db에 저장된 데이터 뿌리기
app.get('/list',function(요청, 응답){
    //db에 저장된 모든 데이터 가져오기, 메타데이터 포함.
    db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
        //가져온 데이터를 ejs 파일에 넣는다
        응답.render('list.ejs',{posts : 결과});
    }); 
});

//글목록에서 검색한 결과 뿌리기 ES6 arrow function
app.get('/search', (요청, 응답) => {
    var 검색조건 = [
        {
          $search: {
            index: 'titleSearch',
            text: {
              query: 요청.query.value,
              path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
            }
          }
        },
        { $sort : { _id : -1}}
    ]
    console.log(요청.query.value); //query string이 담겨있다.
    db.collection('post').aggregate(검색조건).toArray((에러,결과) => {
        console.log(결과)
        응답.render('search.ejs', {posts : 결과});
    });
});



//삭제 버튼 누르면 글 삭제
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

//상세글보기
app.get('/detail/:id', function(요청, 응답){
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        응답.render('detail.ejs', {data : 결과})
    });
})


//글 수정 페이지에 데이터 뿌리기 
app.get('/edit/:id', function(요청, 응답) {
    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        응답.render('edit.ejs', {post : 결과}); 
    });
});

//수정 버튼 눌렀을 때 글 수정
app.put('/edit', function(요청, 응답){
    db.collection('post').updateOne({_id : parseInt(요청.body.id)},{ $set : {제목 : 요청.body.title, 날짜 : 요청.body.date} },function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        console.log('수정 완료');
        응답.redirect('/list')
    })
});


//회원정보 암호화
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

//회원정보 암호화 풀기
passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({id : 아이디}, function(에러, 결과){
        done(null, 결과);
    })
});


//회원가입하기
app.post('/register', function (요청, 응답) {
    if(!db.collection('login').findOne({id:요청.body.id})){
        bcrypt.hash(요청.body.pw, saltRounds, function (err, hash) {
        db.collection('login').insertOne({ id: 요청.body.id, pw: hash}, function (에러, 결과) {
            응답.redirect('/')
        })}
    )}else {
        응답.send("<script>alert('중복된 아이디입니다.'); window.location.replace('/login');</script>");
    }
})

//로그인 페이지 뿌리기
app.get('/login', function(요청, 응답){
    응답.render('login.ejs')
});

//로그인하기
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러)
        if (!결과) return done(null, false, { message: '존재하지않는 아이디' })
        bcrypt.compare(입력한비번, 결과.pw, function (에러, isMatch) {
            if (isMatch) {
                return done(null, 결과)
            } else {
                return done(null, false, { message: '비밀번호 오류' })
            }
        })
    })
}));

//로그인 성공하면 첫화면으로
app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail',
    failureFlash: true
}), function(요청, 응답){
    응답.redirect('/')
});

//로그인 실패하면 로그인 화면 다시 가기
app.get('/fail', function(요청, 응답){
    응답.redirect('/login')
})

//마이페이지 뿌리기
app.get('/mypage', 로그인했니, function(요청, 응답){
    console.log(요청.user);
    응답.render('mypage.ejs', {사용자 : 요청.user});
})

//마이페이지 뿌릴 때 로그인여부 확인
function 로그인했니(요청, 응답, next){
    if(요청.user){
        next()
    } else{
        응답.send('로그인이 필요한 페이지입니다')
    }
} 