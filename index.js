import { getPosts, postPost, toggleLikes, deletePost } from "./api.js";
import { renderAddPostPageComponent } from "./components/add-post-page-component.js";
import { renderAuthPageComponent } from "./components/auth-page-component.js";
import {
  ADD_POSTS_PAGE,
  AUTH_PAGE,
  LOADING_PAGE,
  POSTS_PAGE,
  USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent, renderUserPosts } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import {
  getUserFromLocalStorage,
  removeUserFromLocalStorage,
  saveUserToLocalStorage,
} from "./helpers.js";

export let user = getUserFromLocalStorage();
export let page = null;
export let posts = [];
console.log(user);
const getToken = () => {
  const token = user ? `Bearer ${user.token}` : undefined;
  return token;
};

export const logout = () => {
  user = null;
  removeUserFromLocalStorage();
  goToPage(POSTS_PAGE);
};

/**
 * Включает страницу приложения
 */
export const goToPage = (newPage, data) => {
  if (
    [
      POSTS_PAGE,
      AUTH_PAGE,
      ADD_POSTS_PAGE,
      USER_POSTS_PAGE,
      LOADING_PAGE,
    ].includes(newPage)
  ) {
    if (newPage === ADD_POSTS_PAGE) {
      // Если пользователь не авторизован, то отправляем его на авторизацию перед добавлением поста
      page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
      if (user) {
        return getPosts({ token: getToken() }, user._id)
          .then((newPosts) => {
            posts = newPosts;
            renderApp();
          })
          .catch((error) => {
            console.error(error);
            goToPage(POSTS_PAGE);
          });
      }
      else {
        return renderApp();
      }
    }

    if (newPage === POSTS_PAGE) {
      page = LOADING_PAGE;
      renderApp();

      return getPosts({ token: getToken() })
        .then((newPosts) => {
          page = POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          goToPage(POSTS_PAGE);
        });
    }

    if (newPage === USER_POSTS_PAGE) {
      // TODO: реализовать получение постов юзера из API
      console.log("Открываю страницу пользователя: ", data.userId);
      page = USER_POSTS_PAGE;
      posts = [];
      return getPosts({ token: getToken() }, data.userId)
      .then((newPosts) => {
        posts = newPosts;
        renderApp();
      })
      .catch((error) => {
        console.error(error);
        goToPage(POSTS_PAGE);
      });
  }
  page = newPage;
  renderApp();
  return;
}
throw new Error("страницы не существует");
};

const renderApp = () => {
  const appEl = document.getElementById("app");
  if (page === LOADING_PAGE) {
    return renderLoadingPageComponent({
      appEl,
      user,
      goToPage,
    });
  }

  if (page === AUTH_PAGE) {
    return renderAuthPageComponent({
      appEl,
      setUser: (newUser) => {
        user = newUser;
        saveUserToLocalStorage(newUser);
        goToPage(POSTS_PAGE);
      },
      user,
      goToPage,
    });
  }

  if (page === ADD_POSTS_PAGE) {
    return renderAddPostPageComponent({
      appEl,
      onAddPostClick({ description, imageUrl }) {
        console.log("Добавляю пост...", { description, imageUrl });
        postPost({ token: getToken() }, description, imageUrl)
          .then(() => {
            goToPage(POSTS_PAGE);
          })
          .catch((error) => {
            console.error(error);
            goToPage(ADD_POSTS_PAGE);
          });
      },
      posts
    });
  };

  if (page === POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
    });
  }

  if (page === USER_POSTS_PAGE) {
    // TODO: реализовать страницу фотографию пользвателя
    return renderUserPosts({
      appEl,
    });
  }
};

goToPage(POSTS_PAGE);

export function onClickLike(id, isLike) {
  if (user) {
    toggleLikes({ token: getToken() }, id, isLike).then((data) => {
      posts = posts.map(item => {
        if (item.id === data.post.id) {
          return data.post;
        }
        return item;
      })
    }).then(() => {
      renderApp();
    })
  }
  else {
    alert("Авторизуйтесь, чтобы иметь возможность ставить лайки");
    goToPage(AUTH_PAGE);
  }
};

export function onDeleteClick({ id }) {
  if (user) {
    deletePost({ token: getToken() }, { id }).then(() => {
      goToPage(ADD_POSTS_PAGE);
    }).catch((error) => {
      console.error(error);
    });
  };
};
