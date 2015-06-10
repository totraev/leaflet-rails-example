require 'clustering'

class ClusterController < ActionController::Base

  protect_from_forgery with: :null_session

  def index
    render json: {:list => Rails.cache.fetch('cluster')}
  end
end
