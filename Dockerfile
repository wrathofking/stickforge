FROM php:8.2-apache

# Enable Apache mod_rewrite & mod_deflate
RUN a2enmod rewrite deflate headers expires

# Install required PHP extensions (cURL, mbstring, PostgreSQL / MySQL / Aurora RDS PDO)
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libonig-dev \
    libpq-dev \
    && docker-php-ext-install curl mbstring pdo_pgsql pgsql pdo_mysql mysqli \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Set proper permissions for storage directory
RUN mkdir -p /var/www/html/data/projects \
    && chown -R www-data:www-data /var/www/html/data \
    && chmod -R 775 /var/www/html/data

EXPOSE 80
CMD ["apache2-foreground"]
