Rails.application.routes.draw do
  root 'application#home'
  get '/cluster', to: 'cluster#index'
end
