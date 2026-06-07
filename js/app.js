
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, where, updateDoc, orderBy} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  // Import the functions you need from the SDKs you need
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "***",
    authDomain: "****",
    projectId: "****",
    storageBucket: "****",
    messagingSenderId: "****",
    appId: "****",
    measurementId: "****"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);


  const db = getFirestore(app);
  const ref = collection(db, "dajun");
  const classRef = collection(db, "classes");
  const sessionRef = collection(db, "sessions");

let currentDocs = [];


let sessionListener = null;

function startListeningSessions() {
    if (sessionListener) { sessionListener(); }
    const q = query(sessionRef, where("classId", "==", currentClass));

    sessionListener = onSnapshot(q, function(snapshot) {
        $("#thread-list").empty(); 
        
        snapshot.docs.forEach((doc) => {
            const sessionData = doc.data();
            $("#thread-list").append(
            '<li data-id="' + doc.id + '" data-name="' + sessionData.name + '">' + 
                sessionData.name + 
                '<button class="delete-thread-btn" style="float: right; background-color: #9b9a9a; font-size: 12px; padding: 2px 8px; margin-top: -2px;">❌</button>' +
            '</li>'
            );
        });
    });
}

$("#thread-list").on("click", ".delete-thread-btn", function(e) {
    e.stopPropagation(); 
    
    if (confirm("この試合（スレッド）を本当に削除しますか？")) {
        const id = $(this).parent().data("id"); 
        const docRef = doc(db, "sessions", id);  
        deleteDoc(docRef);                   
    }
});



function startListening() {
    const q = query(
        ref, 
        where("classId", "==", currentClass),
        where("sessionId", "==", currentSession)
        );

    onSnapshot(q, function(snapshot){
        $("#order-table-body").empty();
        $("#result-table-body").empty();
        currentDocs = snapshot.docs;
        const sortedDocs = [...snapshot.docs].sort((a, b) => {
            const orderA = a.data().battingOrder || 999;
            const orderB = b.data().battingOrder || 999;
            return orderA - orderB;
        });

        sortedDocs.forEach((doc) => {
            let orderDisplay = doc.data().battingOrder ? doc.data().battingOrder : '?';
            //オーダー入力画面
            let h = '<tr>';
            h += '<td>' + orderDisplay + '</td>';
            h += '<td>' + doc.data().uname + '</td>';
            h += '<td>' + doc.data().productTitle + '</td>'; 
            h += '<td>' + doc.data().memo + '</td>';
            h += '<td><button class="cancel-btn" data-id="' + doc.id + '">キャンセル</button></td>'; 
            h += '</tr>';
            $("#order-table-body").append(h);

            // オーダー結果画面
            let h2 = '<tr>';
            h2 += '<td>' + orderDisplay + '</td>';
            h2 += '<td>' + doc.data().uname + '</td>';
            h2 += '<td>' + doc.data().productTitle + '</td>'; 
            h2 += '<td>' + doc.data().memo + '</td>';
            h2 += '</tr>';
            $("#result-table-body").append(h2);


        });
    });
}



$('#class-list').on('click', 'li', function() {
    currentClass = $(this).data('name');
    localStorage.setItem("savedClass", currentClass);
    $('#session-page h2').text(currentClass + " 試合表");
    $('#class-page').hide();
    $('#session-page').show();
    startListeningSessions();
});


$('#add-class-btn').on('click', function() {
    const className = $("#class-name-input").val().trim();
    if (className === "") {
        alert("クラス名を入力してください");
        return;
    }
    // Firebase「classes」コレクションに保存
    addDoc(classRef, {
        name: className,
        createdAt: new Date()
    });
    $("#class-name-input").val(""); // 入力欄リセット
});


onSnapshot(classRef, function(snapshot) {
    $("#class-list").empty();
    snapshot.docs.forEach((doc) => {
        const classData = doc.data();
        $("#class-list").append(
            '<li data-id="' + doc.id + '" data-name="' + classData.name + '">' +
                classData.name + 
                '<button class="delete-class-btn" style="float: right; background-color: #bebebe; font-size: 12px; padding: 2px 8px; margin-top: -2px;">❌</button>' +
            '</li>'
        );
    });
});


let currentClass = "";

$('.back-btn').on('click', function() {
    localStorage.removeItem("savedClass"); 
    localStorage.removeItem("savedSession");
    $('#session-page').hide(); 
    $('#class-page').show();
});


let currentSession = "";
const savedClass = localStorage.getItem("savedClass");
const savedSession = localStorage.getItem("savedSession");

// 「試合表」リロード
if (savedClass){
    currentClass = savedClass;
    $('#class-page').hide();
    $('#session-page').show();
    startListeningSessions();

// 「オーダーページ」リロード
    if (savedSession) {
        currentSession = savedSession;
        $('#current-thread-title').text(savedSession); 
        $('#session-page').hide();
        $('#order-page').show();
        startListening(); 
    }
};


$('#thread-list').on('click', 'li', function() {
    let threadName = $(this).data('name');
    currentSession = threadName;
    localStorage.setItem("savedSession", currentSession);
    $('#current-thread-title').text(threadName);
    $('#session-page').hide();
    $('#order-page').show();
    startListening();
});

$('.back-btn-to-session').on('click', function() {
    localStorage.removeItem("savedSession");
    $('#order-page').hide(); 
    $('#session-page').show();
});


$('#add-thread-btn').on('click', function() {
    const threadName = $("#thread-name-input").val().trim();
    if (threadName === "") {
        alert("授業名を入力してください（例：6月9日 JS）");
        return;
    }
    // Firebaseの「sessions」クラス名とセットで保存
    addDoc(sessionRef, {
        name: threadName,
        classId: currentClass,
        createdAt: new Date()
    });

    $("#thread-name-input").val(""); // 入力欄を空にする
});


$('#back-to-top-btn').on('click', function() {
    localStorage.removeItem("savedClass"); 
    localStorage.removeItem("savedSession");
    
    $('#order-page').hide(); 
    $('#class-page').show();
});

$("#class-list").on("click", ".delete-class-btn", function(e) {
    e.stopPropagation(); 
    if (confirm("このクラスを本当に削除しますか？")) {
        const id = $(this).parent().data("id"); 
        const docRef = doc(db, "classes", id);  
        deleteDoc(docRef);                    
    }
});



// 挙動

$('#entry-btn').on('click', function() {
    const ob = {
        uname: $("#uname").val(),
        productTitle:  $("#product-title").val(),
        memo:  $("#memo").val(),
        classId: currentClass,
        sessionId: currentSession,
        battingOrder: null
    };
    const docRef = addDoc(ref, ob);   //自動採番で登録
    $("#uname").val("");
    $("#product-title").val("");
    $("#memo").val("");
});



$("#order-table-body").on("click", ".cancel-btn", function() {
    const id = $(this).data("id");
    const docRef = doc(db, "dajun", id);
    deleteDoc(docRef);
});



// 演出

$("#order-submit-btn").on("click", function() {
    if (currentDocs.length === 0) {
        alert("選手の登録がありません");
        return;
    }

    let indexes = currentDocs.map((_, i) => i);
    for (let i = indexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }
    indexes.forEach((docIndex, orderIndex) => {
        const docData = currentDocs[docIndex];
        const docRef = doc(db, "dajun", docData.id);
        updateDoc(docRef, {
            battingOrder: orderIndex + 1 // 1番打者から割り振り
        });
    });

    $("#director-overlay").show();
    $("#director-img").attr("src", "img/order_1.jpg");

    // １コマ目
    setTimeout(function() {
        $("#director-img").attr("src", "img/order_2.jpg");
    }, 850);

    // ２コマ目
    setTimeout(function() {
        $("#director-img").attr("src", "img/order_1.jpg");
    }, 1800);

    // 3コマ目
    setTimeout(function() {
        $("#director-img").attr("src", "img/order_3.jpg");
    }, 3000);

    // 4コマ目
    setTimeout(function() {
        $("#director-img").hide();
        $("#manga-lines").show();
    }, 4400);

    setTimeout(function() {
        $("#director-img").hide(); 
        $("#director-overlay").css("background-color", "transparent"); 
        $("#order-page").hide();
        $("#match-result-page").show();
        $("#manga-lines").show(); // 漫画線
    }, 4400);

    setTimeout(function() {
        $("#director-overlay").hide(); 
        $("#manga-lines").hide();
        $("#director-overlay").css("background-color", "#000000");
        $("#director-img").show();
    }, 5400);
});

// Play Ball !!

$("#play-ball-btn").on("click", function() {
    $("#playball-overlay").fadeIn(300, function() {
        $("#match-result-page").hide();
        $("#order-page").show();
        setTimeout(function() {
            $("#playball-overlay").fadeOut(1000);
        }, 1000);
    });
});

// game set

$("#game-set-btn").on("click", function() {
    // 演出なしでサクッと通常のオーダー画面に戻す
    $("#match-result-page").hide();
    $("#order-page").show();
});