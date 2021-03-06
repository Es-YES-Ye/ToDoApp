//서버 오픈하는 문법
const express = require('express'); //설치한 라이브러리 첨부
const app = express(); //라이브러리를 이용해서 새로운 객체 생성
const request = require("request")
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
const nodemailer = require('nodemailer');
// const cookieParser = require('cookie-parser');


// app.use(cookieParser());
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


// //첫화면
app.get('/', function(요청, 응답) { 

    console.log('파람',요청.params);

    //날씨 가져오기
    const request = require('request');
    request(
        'http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=&units=metric&lang={kr}', 
    function (error, res, body) {
        const data = JSON.parse(body)
        if(res.statusCode === 200)
    {
        console.log(data.weather)
        응답.render('index.ejs' ,{ weather : data.weather[0].description, icon : data.weather[0].icon, 사용자 : 요청.params});
        // 응답.send(data.list[1].weather[0].description)
        console.log('날씨')
    }
    if(error){
        console.log(error)
    }
    });
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

//회원가입 페이지 뿌리기
app.get('/register', function(요청, 응답){
    응답.render('register.ejs')
})

//회원가입하기
app.post('/register', function (요청, 응답) {

    if(db.collection('login').findOne({id:요청.body.id})){
        bcrypt.hash(요청.body.pw, saltRounds, function (err, hash) {
        db.collection('login').insertOne({ email: 요청.body.email, id: 요청.body.id, pw: hash}, function (에러, 결과) {
            console.log('회원가입 성공')
            console.log(결과)
            응답.send("<script>alert('회원가입을 축하합니다!'); window.location.replace('/login');</script>");
        })}
    )}else {
        응답.send("<script>alert('중복된 아이디입니다.'); window.location.replace('register.ejs');</script>");
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

//로그인 성공하고 indexaflogin 페이지로
app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail',
    failureFlash: true
}), function(요청, 응답){ 
    응답.redirect('/indexaflogin');
});


//로그인 실패하면 로그인 화면 다시 가기
app.get('/fail', function(요청, 응답){
    응답.send("<script>alert('로그인에 실패하였습니다. 다시 시도하세요.'); window.location.replace('/login');</script>");
})

//indexaflogin페이지 뿌리기
app.get('/indexaflogin', function(요청, 응답){
        //날씨 가져오기
        const request = require('request');
        request(
            'http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=&units=metric&lang={kr}', 
        function (error, res, body) {
            const data = JSON.parse(body)
            if(res.statusCode === 200)
        {
            console.log(data.weather)
            응답.render('indexaflogin.ejs' ,{ weather : data.weather[0].description, icon : data.weather[0].icon, 사용자 : 요청.params});
            // 응답.send(data.list[1].weather[0].description)
            console.log('날씨')
        }
        if(error){
            console.log(error)
        }
        });

})


//구글 로그인
const { OAuth2Client} = require('google-auth-library')
var GoogleStrategy   = require('passport-google-oauth2').Strategy;
var GOOGLE_CLIENT_ID = ''
var GOOGLE_SECRET = ''

passport.use(new GoogleStrategy(
    {
      clientID      : GOOGLE_CLIENT_ID,
      clientSecret  : GOOGLE_SECRET,
      callbackURL   : '/login',
      passReqToCallback   : true
    }, function(request, accessToken, refreshToken, profile, done){
      console.log('profile: ', profile);
      var user = profile;
  
      done(null, user);
    }
  ));
  

//로그아웃
app.get('/logout', function(요청,응답){
    console.log('로그아웃')
    요청.logout();
    요청.session.save(function(){
        응답.redirect('/');
    })
})


//마이페이지 뿌릴 때 로그인여부 확인하는 함수
function 로그인했니(요청, 응답, next){
    if(요청.user){
        next()
    } else{
        응답.send("<script>alert('로그인이 필요합니다.'); window.location.replace('/login');</script>");
    }
} 

//마이페이지 뿌리기
app.get('/mypage', 로그인했니, function(요청, 응답){
    console.log(요청.user);
    응답.render('mypage.ejs', {사용자 : 요청.user});
})

//마이 페이지 내 정보 수정에 데이터 뿌리기 
app.get('/mypage/:id', function(요청, 응답) {
    console.log('주소파람',요청.params.id)
    db.collection('login').findOne({id : parseInt(요청.params.id)},function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        응답.render('mypage.ejs', {user : 결과}); 
    });
});

//마이 페이지 내정보수정
app.put('/mypage', function(요청, 응답){
   
    var 수정할데이터 = {id : 요청.user}
    console.log('인풋',요청.body.id)
    console.log('mypage수정할데이터', 수정할데이터)

    if(db.collection('login').findOne({id : 요청.body.id})){
        bcrypt.hash(요청.body.pw, saltRounds, function (err, hash) {
           db.collection('login').updateOne({id : 요청.user.id},{ $set : {email : 요청.body.email, pw : hash} },function(에러, 결과){
            if(에러){return console.log(에러)};
            console.log(결과);
            console.log('회원 정보 수정 완료');
            응답.send("<script>alert('회원 정보 수정이 완료되었습니다!'); window.location.replace('/mypage');</script>");
            })
        })
    }
});



//글쓰기 버튼 눌렀을 때 글쓰기 페이지
app.get('/write', function(요청, 응답) { 
    if(요청.user){
    응답.render('write.ejs')
    } else{
        응답.send("<script>alert('로그인이 필요합니다.'); window.location.replace('/login');</script>");
    }
});

//글쓰고 submit 했을 때 db에 저장
app.post('/add', function(요청, 응답){
    
    응답.send("<script>alert('할 일 등록 완료'); window.location.replace('/mytodo');</script>");
    //응답.send('전송완료');
    db.collection('counter').findOne({name : '게시물갯수'}, function(에러,결과){
        if(에러) {return console.log(에러)};
        console.log(요청.body.title);
        console.log(요청.body.date);
        console.log(결과.totalPost); //findOne으로 가져온 데이터 중 totalPost 이름을 가진 데이터를 출력
        //응답.redirect('/list')
        
        //글 번호 달아서 글 db에 넣기    
        var 총게시물갯수 = 결과.totalPost; //총게시물갯수 라는 변수에 결과.totalPost를 저장 
        var db저장 = {_id: 총게시물갯수 + 1, 작성자: 요청.user.id, 제목: 요청.body.title, 날짜: 요청.body.date, 메모: 요청.body.memo, 우선순위: 요청.body.priority, 완료: false, 공개: false}
        
        db.collection('post').insertOne(db저장 , function(에러, 결과){
            if(에러) {return console.log(에러)};
            console.log('저장 완료');
            //counter라는 콜렉션에 있는 totalPost라는 항목도 1 증가(로 수정한다)
            db.collection('counter').updateOne({name:'게시물갯수'}, {$inc : {totalPost : 1 }}, function(에러, 결과){
                if(에러){return console.log(에러)};
                console.log('totalPost 증가 완료');
                //결과.redirect('/list')
            });
        });      
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


//나의 todo 리스트 진행 중인 할 일 뿌리기 (기본 첫 화면)
app.get('/mytodo', 로그인했니, function(요청, 응답){
    console.log(요청.user);
    if(요청.user.id){
        db.collection('post').find({작성자 : 요청.user.id, 완료 : false}).toArray(function(에러, 결과){
            console.log('db에서 작성자 찾은 결과-mytodo')
            console.log(결과);
            console.log('아이디')
            console.log(요청.user.id);
            //가져온 데이터를 ejs 파일에 넣는다
            응답.render('mytodo.ejs',{myposts : 결과, user : 요청.user.id});
            if(에러){return console.log(에러)};
        }); 
    } else{
        console.log(요청.user.id);
        console.log(요청.login.id);
        응답.send("<script>alert('로그인이 필요합니다.'); window.location.replace('/login');</script>");    }
})

//MyToDo에서 완료된 TO DO 글목록에 함께 뿌리기
app.get('/allmytodo', 로그인했니, function(요청, 응답){
    console.log(요청.user.id);
    if(요청.user.id){
        db.collection('post').find({작성자 : 요청.user.id}).toArray(function(에러, 결과){
            console.log('db에서 작성자 찾은 결과-allmytodo')
            console.log(결과);
            console.log('아이디')
            console.log(요청.user.id);
            //가져온 데이터를 ejs 파일에 넣는다
            응답.render('mytodo.ejs',{myposts : 결과, user : 요청.user.id});
            if(에러){return console.log(에러)};
        }); 
    } else{
        console.log(요청.user.id);
        console.log(요청.login.id);
        응답.send("<script>alert('로그인이 필요합니다.'); window.location.replace('/login');</script>");    
    }
})


//나의 todo 리스트에서 완료 버튼 눌렀을 때 할 일 완료로 변경
app.put('/complete', function(요청,응답){
    요청.body._id = parseInt(요청.body._id); //'1'이라는 문자를 정수로 변환
    //요청.body에 담긴 게시물 번호에 따라 DB에서 게시물 삭제
    
    var 수정할데이터 = {_id : 요청.body._id}

    db.collection('post').updateOne(수정할데이터,{ $set : {완료 : true} },function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log(결과);
        console.log('할 일 완료');
        console.log(요청.body._id)
        console.log(요청.user._id)
        응답.send("<script>alert('할 일 완료! 축하!'); window.location.replace('/mytodo');</script>"); 
    })
});

app.get('/complete', function(요청, 응답){
    응답.send("<script>alert('할 일 완료! 축하!'); window.location.replace('/mytodo');</script>"); 
})
//MyToDo에서 공유중인 toDo만 보기


//삭제 버튼 누르면 글 삭제
app.delete('/delete', function(요청, 응답){
    console.log('삭제 버튼 클릭');
    console.log('삭제 글번호', 요청.body._id)
    console.log('작성자', 요청.user.id)
    //요청.body에 담긴 게시물 번호에 따라 DB에서 게시물 삭제
    
    var 삭제할데이터 = {_id : parseInt(요청.body._id), 작성자 : 요청.user.id}
    console.log('삭제할데이터', 삭제할데이터)

    db.collection('post').deleteOne(삭제할데이터, function(에러, 결과){
        if(에러){return console.log(에러)};
        //delete 성공했을 때 
        console.log('삭제 완료');
        console.log(결과)
        응답.status(200).send({message : '성공했습니다.'});
    })
});


//수정 버튼 눌렀을 때 글 수정
app.put('/edit', function(요청, 응답){
    console.log('수정버튼눌렀을때 그냥 edit')
    console.log('글수정데이터전송', 요청.body)
    console.log('인풋',요청.body.postid)
    
    var 수정할데이터 = {_id : parseInt(요청.body.postid), 작성자 : 요청.user.id}
    var 수정내용 =  {제목 : 요청.body.title, 날짜 : 요청.body.date, 우선순위 : parseInt(요청.body.priority), 메모 : 요청.body.memo}

    db.collection('post').updateOne(수정할데이터,{ $set : 수정내용},function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log('수정 완료! 결과', 결과);
        응답.send("<script>alert('수정 완료되었습니다.'); window.location.replace('/mytodo');</script>");    
    })
});

//글 수정 페이지에 데이터 뿌리기 
app.get('/edit/:id', function(요청, 응답) {
    console.log('아이디', 요청.user.id)
    console.log('글번호', 요청.params.id)

    db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러, 결과){
        if(에러){return console.log(에러)};
        console.log('데이터뿌리기', 결과)
        응답.render('edit.ejs', {post : 결과}); 
    });
});



//이메일보내기
app.get('/email', function(요청, 응답){
    db.collection('post').find({작성자 : 요청.user.id, 완료 : false}).toArray(function(에러, 결과){
        console.log('이메일버튼 db에서 작성자 찾은 결과-mytodo')
        
        function db내용(){
        var 할일목록 = [];
        for(var i=0; i<결과.length; i++){

            할일목록.push('우선 순위 : ' + 결과[i].우선순위);
            할일목록.push('마감 날짜 : ' + 결과[i].날짜);
            할일목록.push('제목 : ' + 결과[i].제목);
            할일목록.push('메모 : ' + 결과[i].메모);
        }
        return 할일목록;
    };
    console.log('함수로', db내용());
    var 파싱 = JSON.stringify(db내용(), null, 4);
    console.log('파싱', 파싱);

    //보내는 사람 이메일 계정
    const transporter = nodemailer.createTransport({ 
        service: 'gmail', 
        port: 465, 
        secure: true, // true for 465, false for other ports 
        auth: { // 이메일을 보낼 계정 데이터 입력 
            user: emailaddr, 
            pass: pw, 
        }, 
    }); 

    //받는 사람 이메일 주소와 할 일 내용 보내기
    const emailOptions = { // 옵션값 설정 
        from: '오늘, 할 일', 
        to: 요청.user.email, 
        subject: '오늘 할 일, 리스트입니다.', 
        html: "<h1> 오늘, 할 일 </h1><br><br><h3>오늘까지 진행 중인 할 일 리스트입니다.</h3> <br><br>" 
        + 파싱 + "<br><br>", }; 
        
        transporter.sendMail(emailOptions); //전송
    응답.send("<script>alert('이메일이 전송되었습니다.'); window.location.replace('/mytodo');</script>");    
});    
});
