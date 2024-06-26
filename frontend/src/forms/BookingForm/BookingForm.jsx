import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createRoomBooking } from '../../api-client';
import toast from 'react-hot-toast';

function BookingForm({currentUser, paymentIntent}) {
    const stripe = useStripe()
    const elements = useElements()
    const navigate = useNavigate()

    const search = useSelector((state) => state.search)
    const {token} = useSelector((state) => state.auth)
    const {hotelId} = useParams()

    const { mutate: bookRoom, isPending } = useMutation({
      mutationFn: (formData, token) =>  createRoomBooking(formData, token),
      onSuccess: () => {
        toast.success("Booking saved!")
        navigate("/my-bookings")
      },
      onError: (err) => {
        toast.error(`Error: ${err.message}`)
      }
    })

    const {
        register,
        handleSubmit
    } = useForm({
      defaultValues: {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        adultCount: search.adultCount,
        childCount: search.childCount,
        checkIn: search.checkIn.toISOString(),
        checkOut: search.checkOut.toISOString(),
        hotelId: hotelId,
        totalCost: paymentIntent.totalCost,
        paymentIntentId: paymentIntent.paymentIntentId
      }
    })


    const onSubmit = async(formData) => {
      const toastId = toast.loading("Loading...")
      
      if(!stripe || !elements) {
        return;
      }

      const result = await stripe.confirmCardPayment(
        paymentIntent.clientSecret, 
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      )

      console.log(result);

      if(result.paymentIntent?.status === "succeeded") {
        //book the room
        bookRoom({...formData, paymentIntentId: result.paymentIntent.id, token})
      }

      toast.dismiss(toastId)
    }

  return (
    <form className='grid grid-cols-1 gap-5 rounded-lg border border-slate-300 p-5'
      onSubmit={handleSubmit(onSubmit)}
    >
      <span className='text-3xl font-bold'>Confirm Your Details</span>

      <div className='grid grid-cols-2 gap-6'>
        <label className='text-gray-700 text-sm font-bold flex-1'>
          First Name

          <input className='mt-1 border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 font-normal'
            type='text'
            readOnly
            disabled
            {...register("firstName")}
          />
        </label>

        <label className='text-gray-700 text-sm font-bold flex-1'>
          Last Name

          <input className='mt-1 border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 font-normal'
            type='text'
            readOnly
            disabled
            {...register("lastName")}
          />
        </label>

        <label className='text-gray-700 text-sm font-bold flex-1'>
          Email

          <input className='mt-1 border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 font-normal'
            type='email'
            readOnly
            disabled
            {...register("email")}
          />
        </label>

      </div>

      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>Your Price Summary</h2>

        <div className='bg-blue-200 p-4 rounded-md'>
          <div className='font-semibold text-lg'>
            Total Cost: ₹{paymentIntent.totalCost.toFixed(2)}
          </div>
          <div className='text-xs'>Includes taxes</div>
        </div>
      </div>

      
      <div className='space-y-2'>
        <h3 className='text-xl font-semibold'>Payment Details</h3>
        <CardElement id='payment-element' className='border rounded-md p-2 text-sm' />
      </div>

      <div className='flex justify-end'>
        <button 
          disabled={isPending}
          type='submit' 
          className='bg-blue-600 text-white p-2 font-bold hover:bg-blue-500 text-md disabled:bg-gray-500'
        >
          { isPending ? "Saving..." : "Confirm Booking" }
        </button>
      </div>
    </form>
  )
}

export default BookingForm