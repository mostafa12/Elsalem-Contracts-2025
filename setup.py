from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in elsalem_contracts_2025/__init__.py
from elsalem_contracts_2025 import __version__ as version

setup(
	name="elsalem_contracts_2025",
	version=version,
	description="Elsalem Contracts 2025",
	author="hossam",
	author_email="hossam.2030@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
