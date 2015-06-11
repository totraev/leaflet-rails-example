require 'net/http'
require 'json'

# Если растояние между точками меньше @@radius, то объединяем их в кластер,
# если точка не принадлежит какому-либо кластеру, то она устанаевливается как кластер
# c числом элементов равному 1. Центр кластера высчивается как среднее значение всех
# точек данного кластера. Полученный результат кешируется

module Clustering
  @@clusters = []
  @@radius = 3**2

  # Запускаем скрипт
  def self.run
    result = http_get('http://api.ais.owm.io/api/box?bbox=-180,-90,180,180')
    result.each do |item|
      set_cluster(item)
    end
    puts @@clusters.length
    Rails.cache.write('cluster', @@clusters)
  end

  # Заспрос на сервер. Возвращает массив элементов
  def self.http_get(url)
    puts 'send request, please wait...'

    json = Net::HTTP.get(URI.parse(url))

    puts 'get response'

    data = JSON.parse(json)
    data['list']
  end

  # Либо добавляем элемент в кластер, либо создает кластер
  def self.set_cluster(item)

    @@clusters.each do |cluster|
      if self.in_radius(cluster['center'], item['coord'])
        self.add_item(cluster, item)
        return
      end
    end

    new_cluster={
        'count'=>1,
        'center'=>item['coord']
    }

    @@clusters.push(new_cluster)
  end


  def self.in_radius(p1, p2)
    x = (p1[0]-p2[0])**2
    y = (p1[1]-p2[1])**2

    return (x+y < @@radius)
  end

  # Добавляет элемент в кластер, устанавливает новое значение центра кластера
  def self.add_item(cluster, item)
    lng = cluster['center'][0]*cluster['count'] + item['coord'][0]
    lat = cluster['center'][1]*cluster['count'] + item['coord'][1]

    cluster['count']+=1
    cluster['center']=[lng/cluster['count'], lat/cluster['count']]
  end

end