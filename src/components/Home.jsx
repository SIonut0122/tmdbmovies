import React, { useRef } from 'react';
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import noImageAvailable from '../assets/images/No-Image-Placeholder.png';
import movieIcon from '../assets/images/video-editing_8242575.png';




function Home() {

const [moviesData, setMoviesData] = useState([]);
const [favoritesList, setFavoritesList] = useState([]);
const [openFavoritesCont, setOpenFavoritesCont] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [searchInputValue, setSearchInputValue] = useState('');
const timeoutRef = useRef(null);
const [genres, setGenres] = useState([]);
const [genreId, setGenreId] = useState('');
const [selectedCategory, setSelectedCategory] = useState('Popular');
const [exploreType, setExploreType] = useState('popularity');
const [typeState, setTypeState] = useState('explore');
const [displayErrorMsg, setDisplayErrorMsg] = useState('');
const [categoryErrorMsg, setCategoryErrorMsg] = useState('');
const [displayLoadMoreErrorMsg, setDisplayLoadMoreErrorMsg] = useState('');
const [page,setPage] = useState(1);
const [loadMoreLoading, setLoadMoreLoading] = useState(false);


const tmdbtoken = import.meta.env.VITE_TMDB_API_TOKEN;
const tmdbapi = import.meta.env.VITE_TMDB_API_KEY;

const tmdburl = 'https://api.themoviedb.org/3/discover/movie?';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer '+tmdbtoken,
  }
};

useEffect(() => {

  // dropdown 
  const dropdownButton = document.querySelector('.dropdown-button');
  const dropdownContent = document.querySelector('.dropdown-content');

  dropdownButton.addEventListener('click', function() {
      if (dropdownContent.style.display === 'block') {
          dropdownContent.style.display = 'none';
      } else {
          dropdownContent.style.display = 'block';
      }
  });

  // close the dropdown if user clicks outside the dropdown
  window.addEventListener('click', function(event) {
      if (!event.target.matches('.dropdown-button')) {
          if (dropdownContent.style.display === 'block') {
              dropdownContent.style.display = 'none';
          }
      }
  });

  // INITIATE - Fetch genres for the dropdown categories select
  getCategories();
  populateListExplore(exploreType);
},[])



// POPULATE LIST
// EXPLORE

const selectExplore = (type) => {
  // set actual type request
  setTypeState('explore');
  // reset selected genre id
  setGenreId('');
  // get type ('popularity','rating')
  setExploreType(type);
  // reset input
  setSearchInputValue('');
  // reset page no
  setPage(1);
  // close favorites container if is opened
  setOpenFavoritesCont(false);

  // fetch data by type
  populateListExplore(type);
 }

const populateListExplore = (expType) => {
  let exploreURL;
  
  // clear data / enable loading first
  setMoviesData([])
  setIsLoading(true);

  // check which value was selected
  if(expType === 'popularity') {
    setSelectedCategory('Popular');
    // by popularity 
    exploreURL = `${tmdburl}sort_by=popularity.desc&api_key=${tmdbapi}&page=1`;
  } else {
    setSelectedCategory('Top rated');
    // by rating
    exploreURL = `${tmdburl}vote_count.gte=50&sort_by=vote_average.desc&api_key=${tmdbapi}&page=1`;
  }

  fetch(exploreURL, options)
  .then(response => {
    if(response.ok) {
      return response.json();
    } else {
      // disable loading and display error msg
      setIsLoading(false);
      setDisplayErrorMsg('An error occurred while trying to get the movies list');
    }
  })
  .then(response => { 
    markMoviesAsFav(response.results);
  })
  .catch(err => { 
    setIsLoading(false);
    setDisplayErrorMsg(err);   
  });
}

// MARK MOVIES AS FAVORITES
const markMoviesAsFav = (data) => { 
    // check localstorage if any movie is saved
    let localStorageFavorites = localStorage.getItem('tmdb_favorites');
    if (localStorageFavorites !== null && localStorageFavorites.length > 0) {
      let localStorageFavItems = JSON.parse(localStorageFavorites);
      setFavoritesList(localStorageFavItems);

      // get movie id's
      let movieIds = localStorageFavItems.map(el => el.id);
      // map every movie and check the fav list
      // if movie exists inside favorites, set 'added_to_fav' to true
      let markFavoritesMovies = data.map(el => {
        if(movieIds.includes(el.id)) {
          el.added_to_fav = true;
          return el;
        } else {
          return el;
        }
      })
        // disable loading
        setIsLoading(false);
        // set data
        setMoviesData(markFavoritesMovies);

    } else {
      // disable loading + set default data
      setIsLoading(false);
      setMoviesData(data);
    }
}

// CATEGORIES

const getCategories = () => {
  // Fetch genres titles
  fetch('https://api.themoviedb.org/3/genre/movie/list?language=en', options)
  .then(response => {
    if(response.ok) {
      return response.json();
    } else {
      setCategoryErrorMsg('An error occurred while trying to fetch the categories list. Please refresh the page');
    }
  })
  .then(response => { 
    // used for the categories dropdown
    setGenres(response.genres); 
  })
  .catch(err => { 
    setCategoryErrorMsg('Categories list error: '+err+'. Please refresh the page.'); 
  });
}


const selectCategory = (catId,name) => {
  // reset / enable loading
  setMoviesData([])
  setIsLoading(true);

  setGenreId(catId);
  // set actual type request
  setTypeState('genres');
  // hide favorites if displayed
  setOpenFavoritesCont(false);
  // set category name to be displayed
  setSelectedCategory(name);
  // fetch data 
  getMoviesByCategories(catId);
}

// Get the genre id (catId) and fetch data
const getMoviesByCategories = (catId) => {
  let catUrl = `${tmdburl}&with_genres=${catId}&api_key=${tmdbapi}&page=1`;
  // reset error msg
  setDisplayErrorMsg('');
    // reset page no
    setPage(1);

  fetch(catUrl, options)
  .then(response => {
    if(response.ok) {
      return response.json();
    } else {
      // disable loading and display error msg
      setIsLoading(false);
      setDisplayErrorMsg('An error occurred while trying to get the movies list');
    }
  })
  .then(response => { 
    markMoviesAsFav(response.results);
  })
  .catch(err => { 
    setIsLoading(false);
    setDisplayErrorMsg(err);   
  });
}
 
// SEARCH BAR
const handleSearch = (e) => {
  let searchValue = e.target.value;
    // set input value
    setSearchInputValue(searchValue);
   
    // clear timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // if not, proceed
    timeoutRef.current = setTimeout(() => {
      if(searchValue.length > 0) {
         // reset error
        setDisplayErrorMsg('');
        // reset page no
        setPage(1);
        // reset selected genre id
        setGenreId('');
        // clear data / enable loading first
        setMoviesData([])
        setIsLoading(true);
        // text to display as info Movie - 'category'
        setSelectedCategory('Results');
        // used for 'load more'
        setTypeState('search');
        // close favorites container if is opened
        setOpenFavoritesCont(false);

        // search urlapi
        let searchUrl = `https://api.themoviedb.org/3/search/movie?&api_key=${tmdbapi}&query=${searchValue}&page=1`;
      
        fetch(searchUrl, options)
        .then(response => {
          if(response.ok) {
            return response.json();
          } else {
            // disable loading and display error msg
            setIsLoading(false);
            setDisplayErrorMsg('An error occurred while trying to get the movies list');
          }
        })
        .then(response => { 
          markMoviesAsFav(response.results);
        })
        .catch(err => { 
          setIsLoading(false);
          setDisplayErrorMsg(err);   
        });
      } else {
        // reset to default, because input is empty
        resetSearch();
      }
    }, 700);

}

const resetSearch = () => {
  // reset all
  setSelectedCategory('Popular');
  setTypeState('explore');
  setDisplayErrorMsg('');   
  setOpenFavoritesCont(false);
  setSearchInputValue('');
  setPage(1);
  clearTimeout(timeoutRef.current);
  setMoviesData([]);
  populateListExplore('popularity')
}

// ADD TO FAVORITES

const handleFav = (type,movie) => {
  let favList = [...favoritesList];

  if(type === 'add') {
      favList.push(movie);  
      setFavoritesList(favList);

      let markFavMovie = moviesData.map(el => {
        if(el.id === movie.id) {
          el.added_to_fav = true;
          return el;
        } else {
          return el;
        }
      })

      // update dataMovies with the updated fav list / localstorage too
       setMoviesData(markFavMovie);
       localStorage.setItem('tmdb_favorites', JSON.stringify(favList));
 
  } else {
    // remove from fav list
    let removedMovie = favList.filter(el => el.id !== movie.id);
    setFavoritesList(removedMovie);

    // remove added_to_fav from moviesData
    let removeMarkFavMovie = moviesData.map(el => {
      if(el.id === movie.id) {
        el.added_to_fav = false;
        return el;
      } else {
        return el;
      }
    })
    
    // update datamovies
     setMoviesData(removeMarkFavMovie);
    // update localstorage
     localStorage.setItem('tmdb_favorites', JSON.stringify(removedMovie));

  }
}

const openFavorites = () => {
  setOpenFavoritesCont(true);
    // reset values
    setSearchInputValue('');
    setTypeState('explore');
    setPage(1);
    setGenreId('');
}

// LOAD MORE
const loadMore = () => {
  let reqType;
  let loadMoreList = [...moviesData];

  // enable loading for 'load more'
  setLoadMoreLoading(true);
  // reset error msg if any
  setDisplayLoadMoreErrorMsg('');
  // set next page
  let nextPage = page + 1;
  

  if(typeState === 'explore') {
    // detect explore typ
    if(exploreType === 'popularity') {
      reqType = `${tmdburl}sort_by=popularity.desc&api_key=${tmdbapi}&page=${nextPage}`;
    } else {
      reqType = `${tmdburl}vote_count.gte=50&sort_by=vote_average.desc&api_key=${tmdbapi}&page=${nextPage}`;
    }
  } else if(typeState === 'genres') {
    reqType = `${tmdburl}&with_genres=${genreId}&api_key=${tmdbapi}&page=${nextPage}`;
  } else {
    reqType = `https://api.themoviedb.org/3/search/movie?&api_key=${tmdbapi}&query=${searchInputValue}&page=${nextPage}`;
  }
  
  fetch(reqType, options)
  .then(response => {
    if(response.ok) {
      return response.json();
    } else {
      // disable loading and display error msg
      setIsLoading(false);
      setLoadMoreLoading(false);
      setDisplayLoadMoreErrorMsg('An error occurred while trying to load more movies');
    }
  })
  .then(response => { 
    // increase page number
    setPage(page + 1);
    // disable loading
    setLoadMoreLoading(false);
    // push the results inside existing array
    let respData = response.results;
    respData.forEach(el => loadMoreList.push(el));
    // call to render
    markMoviesAsFav(loadMoreList);
  })

  .catch(err => { 
    setIsLoading(false);
    setLoadMoreLoading(false);
    setDisplayLoadMoreErrorMsg(err);   
  });

}

// Skeleton style

function SkeletonWithInlineMargin({ count, width}) {
  const skeletons = Array.from({ length: count }, (value, index) => (
    <span key={index} className='skelet-load-item'>
      <Skeleton width="100%" height="400px" />
    </span>
  ));

  return <div className='skeleton-wrapper'>{skeletons}</div>;
}



  return (
    <div className='home-container container-fluid paddingy'>
        <div className='container'>
        <img className='homecont-logo' src={movieIcon} alt='Icon by FreshForYou from freepik.com'/>

            {/* Search input */}
            <div className='search-input-wrapper'>
               <input type='text'
               tabIndex="0" 
               placeholder='Search movies...'
               value={searchInputValue} 
               onChange={(e) => handleSearch(e)}
               />
               <button className='btn' type='button' onClick={resetSearch}>Reset</button>
            </div>

            {/* Categories error msg */}
            {categoryErrorMsg.length > 0 && (
              <p className='error-msg'>{categoryErrorMsg}</p>
            )}
            
            {/* Categories dropdown / Favorites nav btn */}
            <div className='nav-wrapper'>
                <div className="dropdown">
                    <button className="dropdown-button">
                    <i className="fa-solid fa-list"></i>
                      Categories
                    </button>

                    <div className="dropdown-content">
                       <ul>
                        {
                          genres.map((cat,index) => {
                           return (
                            <li key={index} 
                            data-genre={cat.id}
                            className={cat.id === genreId ? 'category-active-item dropdown-item' : 'dropdown-item'}
                            onClick={(e) => selectCategory(cat.id,cat.name)}>
                            {cat.name}
                            </li>
                           )
                          })
                        }
                        </ul>
                    </div>
                </div>
                <button id="favorites-nav-btn" 
                className='btn' 
                type='button'
                tabIndex="0" 
                onClick={openFavorites}>
                <i className="fa-solid fa-star"></i> 
                 Favorites {favoritesList.length > 0 ? `(${favoritesList.length})` : ''}
                </button>
            </div>
            
            {/* Explore nav - Popular / Top rated buttons */}              
            <div className='filter-nav top-nav'>
                <button className='btn' 
                  type='button'
                  style={{fontWeight: !openFavoritesCont && typeState === 'explore' && exploreType === 'popularity' ? 'bold' : 'normal'}}
                  onClick={(e) => selectExplore('popularity')}>
                    Popular
                </button>

                <button className='btn'
                  type='button' 
                  style={{fontWeight: !openFavoritesCont && typeState === 'explore' && exploreType === 'rating' ? 'bold' : 'normal'}}
                  onClick={(e) => selectExplore('rating')}>
                   Top rated
                </button>
            </div>

            <div className='categories-nav top-nav'>
                <p><span>Movies</span> - {selectedCategory} 
                {typeState !== 'search' && !searchInputValue.length && !openFavoritesCont ? ' ('+ moviesData.length +')' : ''} 
                {typeState === 'search' && searchInputValue.length > 0 && !openFavoritesCont ? ' for "'+searchInputValue+'"'+ ' ' +'( '+ moviesData.length +' )' : ''}</p>
            </div>
            
            {/* Movies list */}
                {!openFavoritesCont ? (
                  <div className='content-wrapper'>

                        {moviesData.length > 0 ? (
                          <ul className='content-items'>
                                {
                                  moviesData.map((movie, ind) => {
                                    return (
                                      <li key={ind}>
                                        <span className='movie-thumb-addtofav-wrp'>
                                        {movie.added_to_fav ? (
                                          <i className='fa-solid fa-star' title='Remove this movie to favorites!' onClick={(e) => handleFav('remove', movie)}></i>
                                        ) : (
                                          <i className='fa-regular fa-star' title='Add this movie to favorites!' onClick={(e) => handleFav('add', movie)}></i>                               
                                        )}
                                        </span>
                                        <img src={movie.poster_path === null ? noImageAvailable : 'https://image.tmdb.org/t/p/w370_and_h556_bestv2/'+movie.poster_path} alt='Movie poster'/>
                                        <div className='movie-thumb-descr'>
                                          <p className='movie-thumb-descr-title' tabIndex='0'>{movie.title !== undefined ? movie.title : movie.name }</p>
                                          <p className='movie-thumb-descr-rating' tabIndex='0'>
                                            <i className="fa-solid fa-star"></i>
                                            {movie.vote_average}
                                          </p>
                                          <p  className='movie-thumb-descr-releasedate' tabIndex='0'>Release date: {movie.release_date}</p>
                                        </div>
                                      </li>
                                    )
                                  })
                                }
                          </ul>

                        ) :
                        (
                          <>
                            {!isLoading && (
                              <div className='results-cont-info'>
                                <p tabIndex='0'>No movie was found ¯\_(ツ)_/¯</p>

                                {displayErrorMsg.length > 0 && ( 
                                  <p className='results-container-msg' tabIndex='0'>{displayErrorMsg}</p>
                                  )
                                }
                              </div>
                              )}
                          </>
                        )}
                        
                        {/* Skeleton loading container */}
                         {isLoading && (
                          <SkeletonWithInlineMargin count={12} />
                         )}
                        
                        
                        {/* Load more error & Load more button */}
                        {!displayLoadMoreErrorMsg.length > 0 && (<p className='results-container-msg'>{displayLoadMoreErrorMsg}</p>)}

                        {moviesData.length > 0 && (
                          <div className='loading-more-wrp'>
                            <button type='button' 
                            tabIndex='0'
                            className='btn load-more-btn'
                            onClick={loadMore}>
                            Load more
                            </button>
                            {loadMoreLoading && (
                              <div className='loading-ring-spn'></div>
                            )}
                          </div>
                        )}
                              
                    </div>
                ) : (
                  <>
                  {/* Favorites container */}
                  <div className='content-wrapper'>
                    {favoritesList.length > 0 ? (
                            <ul className='content-items favorites-ul' style={{'justifyContent': favoritesList.length > 3 ? 'center' : 'flex-start'}}>
                                  {
                                    favoritesList.map((fav, ind) => {
                                      return (
                                        <li key={ind}>
                                          <span className='movie-thumb-addtofav-wrp'>
                                            <i className='fa-solid fa-star' title='Remove this movie to favorites!' onClick={(e) => handleFav('remove', fav)}></i>
                                          </span>
                                          <img src={'https://image.tmdb.org/t/p/w370_and_h556_bestv2/'+fav.poster_path} alt='Movie poster'/>
                                          <div className='movie-thumb-descr'>
                                            <p className='movie-thumb-descr-title'>{fav.title}</p>
                                            <p className='movie-thumb-descr-rating'>
                                              <i className="fa-solid fa-star"></i>
                                              {fav.vote_average}
                                            </p>
                                            <p  className='movie-thumg-descr-releasedate'>Release date: {fav.release_date}</p>
                                          </div>
                                        </li>
                                      )
                                    })
                                  }
                            </ul>
                          ) : (
                              <div className='favorites-list-empty'>
                                <i className="fa-solid fa-star"></i> 
                                <p>Your favorite list is empty</p>
                              </div>
                          )
                        } 
                  </div>
                  </> 
                )}
        </div>
    </div>
  )
}

export default Home
