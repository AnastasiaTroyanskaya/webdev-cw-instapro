import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, onClickLike, user } from "../index.js";
import { ru } from 'date-fns/locale';
import { formatDistanceToNow } from "date-fns";

export function renderPostsPageComponent({ appEl }) {
  // console.log("Актуальный список постов:", posts);

  const postsHtml = posts.map((post) => getPost(post)).join("");
  const appHtml = `
              <div class="page-container">
                <div class="header-container"></div>
                <ul class="list">
                  ${postsHtml}
                </ul>
              </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }
  initLikeButtons();
  initDoubleClick(".post");
  initDoubleClick(".user-post");
};

function getPost(post) {
  const fromDate = formatDistanceToNow(new Date(post.createdAt), { locale: ru });
  return `<li class="post">
  <div class="post-header" data-user-id=${post.user.id}>
      <img src=${post.user.imageUrl} class="post-header__user-image">
      <p class="post-header__user-name" >${post.user.name}</p>
  </div>
  <div class="post-image-container">
    <img class="post-image" src=${post.imageUrl}>
    <div class="heart-icon-cont">
      <img class="heart-icon" src="./assets/images/heart-icon.svg">
    </div>
  </div>
  <div class="post-likes">
    <button data-post-id="${post.id}" class="like-button ${post.isLiked ? 'active-like' : 'inactive-like'}">
    ${post.isLiked ? '<img src="./assets/images/like-active.svg">' : '<img src="./assets/images/like-not-active.svg">'}
    </button>
    <p class="post-likes-text">
      ${(post.likes.at(-1)) ? `Нравится: <strong>${post.likes.at(-1).name}</strong>` : ""}${(post.likes.length - 1 > 0) ? ` и <strong>еще ${post.likes.length - 1}</strong>` : ""} 
    </p>
  </div>
  <p class="post-text">
    <span class="user-name">${post.user.name}</span>
    ${post.description}
  </p>
  <p class="post-date">Опубликовано ${fromDate} назад</p>
</li>`
};

export function renderUserPosts({ appEl }) {
  const postsHtml = posts.map((post) => getUserPost(post)).join("");
  let postsAuthor = posts[0] ? posts[0].user : user;
  const appHtml = `
  <div class="page-container">
    <div class="header-container"></div>
    <div class="posts-user-header">
      <div class="posts-user-header__user-block">
      <img src=${postsAuthor.imageUrl} class="posts-user-header__user-image">
      <p class="posts-user-header__user-name" id="shareLink">${postsAuthor.name}</p>
      </div>
    </div>
    ${posts[0] ?
      `<div id="blockPosts" class="blockPosts">
      <div class="gallery">
        <ul>
         ${postsHtml}
        </ul>
      </div>
      </div>` :
      '<h3 class="form-title">Добавьте сюда фотографии, чтобы заполнить профиль</h3>'}
  </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  const copyUrlToClipboard = () => {
    const currentPageUrl = window.location.href;
    navigator.clipboard.writeText(currentPageUrl);
    alert("Ссылка скопирована в буфер обмена");
  };
  
  const shareLinkEl = document.getElementById("shareLink");
  shareLinkEl.addEventListener("click", copyUrlToClipboard);
  showUserPosts(appEl);
};


const showUserPosts = (appEl) => {
  const blockPostsContainer = appEl.querySelector(".blockPosts")
  if (blockPostsContainer) {
    let i = 1;
    for (let li of blockPostsContainer.querySelectorAll('li')) {
      li.style.position = 'relative';
      li.insertAdjacentHTML('beforeend', `<span style="position:absolute;left:0;top:0"></span>`);
      i++;
    }

    initLikeButtons();
    initDoubleClick(".post");
    initDoubleClick(".user-post");
  }
  else {
    return;
  }

};
function initLikeButtons() {
  for (let dislikeEl of document.querySelectorAll('.active-like'))
    dislikeEl.addEventListener("click", (event) => {
      event.stopPropagation();
      dislikeEl.classList.add('-loading-like');
      onClickLike({ id: dislikeEl.dataset.postId }, "dislike");
    })
  for (let likeEl of document.querySelectorAll('.inactive-like'))
    likeEl.addEventListener("click", (event) => {
      event.stopPropagation();
      likeEl.classList.add('-loading-like');
      onClickLike({ id: likeEl.dataset.postId }, "like");
    })
};



function initDoubleClick (postSelector) {
  const posts = document.querySelectorAll(postSelector);
  for (let post of posts) {
    let lastClickTime = new Date().getTime();
    post.addEventListener("click", () => {
      const currentTime = new Date().getTime();
      if ((currentTime - lastClickTime) < 500) {
        const likeIcon = post.querySelector(".like-button");
        if (likeIcon.classList.contains("inactive-like")) {
          likeIcon.classList.remove("inactive-like");
          likeIcon.classList.add("active-like");
          likeIcon.classList.add('-loading-like');
          let heartIconEl = post.querySelector(".heart-icon");
          heartIconEl.style.display = 'block';
          onClickLike({ id: likeIcon.dataset.postId }, "like");
        } else {
          likeIcon.classList.remove("active-like");
          likeIcon.classList.add("inactive-like");
          likeIcon.classList.add('-loading-like');
          onClickLike({ id: likeIcon.dataset.postId }, "dislike");
        }
      }
      lastClickTime = currentTime;
    })

  }
}

function getUserPost(post) {
  const fromDate = formatDistanceToNow(new Date(post.createdAt), { locale: ru });
  return `
  <li class="user-post">
    <div class="post-user-image-container">
      <img class="user-post-image" src=${post.imageUrl}>
      <div class="heart-icon-cont">
        <img class="heart-icon" src="./assets/images/heart-icon.svg">
      </div>
    </div>
    <div class="post-footer">
      <div class="post-info">
        <div class="post-likes">
          <button data-post-id="${post.id}" class="like-button ${post.isLiked ? 'active-like' : 'inactive-like'}">
           ${post.isLiked ? '<img src="./assets/images/like-active.svg">' : '<img src="./assets/images/like-not-active.svg">'}
          </button>
          <p class="post-likes-text">
            ${(post.likes.at(-1)) ? `Нравится: <strong>${post.likes.at(-1).name}</strong>` : ""}${(post.likes.length - 1 > 0) ? ` и <strong>еще ${post.likes.length - 1}</strong>` : ""} 
          </p>
        </div>
        <p class="post-text"><span class="user-name">${post.user.name}</span> ${post.description}</p>
        <p class="post-date">Опубликовано ${fromDate} назад</p>
      </div>
      <button class="delete-button" data-post-id="${post.id}"></button>
    </div>
  </li>`
};