import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_db():
    try:
        # Connect to default postgres database
        con = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='1234',
            host='localhost',
            port='5432'
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'airport4kgp'")
        exists = cur.fetchone()
        if not exists:
            cur.execute('CREATE DATABASE airport4kgp')
            print("Database 'airport4kgp' created successfully.")
        else:
            print("Database 'airport4kgp' already exists.")
            
        cur.close()
        con.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_db()
