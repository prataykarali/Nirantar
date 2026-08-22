"""Locust HttpUser personas matching the 10k virtual-citizen mix."""

from __future__ import annotations

from locust import HttpUser, SequentialTaskSet, between, task
from locust.exception import StopUser

from loadtest.journeys import booking
from loadtest.journeys.search import CitizenJourneys
from simulation.personas.catalog import LOCUST_WEIGHTS
from contracts.simulation import PersonaKind


class BookingJourney(SequentialTaskSet):
    """Open → search → think → results → select → auth → book → pay → confirm."""

    def on_start(self) -> None:
        self.route = CitizenJourneys.random_search_payload()
        self.booking = CitizenJourneys.random_booking_payload()

    @task
    def open_portal(self) -> None:
        self.client.get(booking.OPEN, name="OPEN /health")

    @task
    def search_trains(self) -> None:
        src, dst = self.route["source"], self.route["destination"]
        self.client.get(
            f"{booking.SEARCH}?source={src}&destination={dst}",
            name="SEARCH /trains/search",
        )

    @task
    def view_results(self) -> None:
        payload = CitizenJourneys.random_availability_payload()
        self.client.post(booking.AVAIL, json=payload, name="RESULTS /availability")

    @task
    def select_and_auth(self) -> None:
        self.client.post(
            booking.INTENT,
            json=booking.intent_body(),
            name="SELECT /citizen/intent",
        )

    @task
    def book_and_pay(self) -> None:
        self.client.post(booking.BOOK, json=self.booking, name="BOOK /booking/initiate")

    @task
    def done(self) -> None:
        self.interrupt()


class SearchHeavyJourney(SequentialTaskSet):
    def on_start(self) -> None:
        self.route = CitizenJourneys.random_search_payload()

    @task
    def open_portal(self) -> None:
        self.client.get(booking.OPEN, name="OPEN /health")

    @task
    def search_again(self) -> None:
        self.client.get(booking.search_url(), name="SEARCH /trains/search")

    @task
    def search_more(self) -> None:
        self.client.get(booking.search_url(), name="SEARCH /trains/search")

    @task
    def search_third(self) -> None:
        self.client.get(booking.search_url(), name="SEARCH /trains/search")

    @task
    def peek_results(self) -> None:
        self.client.post(
            booking.AVAIL,
            json=CitizenJourneys.random_availability_payload(),
            name="RESULTS /availability",
        )

    @task
    def done(self) -> None:
        self.interrupt()


class AbandonedJourney(SequentialTaskSet):
    @task
    def open_portal(self) -> None:
        self.client.get(booking.OPEN, name="OPEN /health")

    @task
    def search_once(self) -> None:
        self.client.get(booking.search_url(), name="SEARCH /trains/search")

    @task
    def leave(self) -> None:
        raise StopUser()


class RapidBotJourney(SequentialTaskSet):
    @task
    def hammer_availability(self) -> None:
        self.client.post(
            booking.AVAIL,
            json=CitizenJourneys.random_availability_payload(),
            name="BOT /availability",
        )

    @task
    def hammer_book(self) -> None:
        self.client.post(
            booking.BOOK,
            json=CitizenJourneys.random_booking_payload(),
            name="BOT /booking/initiate",
        )


class NormalCitizenUser(HttpUser):
    weight = LOCUST_WEIGHTS[PersonaKind.NORMAL]
    wait_time = between(1.2, 3.0)
    tasks = [BookingJourney]


class SearchHeavyUser(HttpUser):
    weight = LOCUST_WEIGHTS[PersonaKind.SEARCH_HEAVY]
    wait_time = between(0.3, 1.0)
    tasks = [SearchHeavyJourney]


class ReturningUser(HttpUser):
    weight = LOCUST_WEIGHTS[PersonaKind.RETURNING]
    wait_time = between(0.6, 1.4)
    tasks = [BookingJourney]


class SlowMobileUser(HttpUser):
    weight = LOCUST_WEIGHTS[PersonaKind.SLOW_MOBILE]
    wait_time = between(4.0, 9.0)
    tasks = [BookingJourney]


class RetryHeavyUser(HttpUser):
    weight = LOCUST_WEIGHTS[PersonaKind.RETRY_HEAVY]
    wait_time = between(0.3, 0.9)
    tasks = [BookingJourney]


class SuspiciousUser(HttpUser):
    weight = LOCUST_WEIGHTS[PersonaKind.SUSPICIOUS]
    wait_time = between(0.05, 0.2)
    tasks = [RapidBotJourney]


class AbandonedUser(HttpUser):
    weight = LOCUST_WEIGHTS[PersonaKind.ABANDONED]
    wait_time = between(2.0, 6.0)
    tasks = [AbandonedJourney]
