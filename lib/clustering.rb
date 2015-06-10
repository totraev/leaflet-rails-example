require 'net/http'
require 'json'

module Clustering

  @@grid =     []
  @@clusters = []


  def self.get_clusters
    @@clusters
  end


  def self.run
    self.init_grid
    self.pull_data
  end


  def self.init_grid(lng_step=36, lat_step=18)
    lng = -180;
    lat = -90;

    while lat < 90 do
      while lng < 180 do
        coord = [lng, lat, lng + lng_step, lat + lat_step]
        @@grid.push(coord)
        lng += lng_step
      end
      lat += lat_step
      lng = -180
    end

  end


  def self.pull_data
    data_item = []

    @@grid.each do |item|
      data_item = self.http_get_item('http://api.ais.owm.io/api/box?bbox=', item)
      cluster = self.clustering(data_item)

      if cluster != nil
        @@clusters.push(cluster)
      end
    end

    Rails.cache.write('cluster', @@clusters)
  end


  def self.http_get_item(url, params)
    url += params.join(',');
    puts url

    json = Net::HTTP.get(URI.parse(url))

    data = JSON.parse(json)
    data['list']
  end


  def self.clustering(data_item)

    len = data_item.length
    center_lng = 0
    center_lat = 0


    data_item.each do |point|
      center_lng += point['coord'][0]
      center_lat += point['coord'][1]
    end

    if len > 0
      center = [center_lng/len, center_lat/len]

      puts center
      puts len

      return cluster = {
          :center => center,
          :count => len
      }
    else
      return nil
    end
  end


end