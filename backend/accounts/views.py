import uuid
from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .serializers import LoginSerializer, SignupSerializer, EmailVerificationSerializer

User = get_user_model()

class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # First check if email exists
            if User.objects.filter(email=email).exists():
                return Response({
                    'error': 'Email already exists',
                    'field': 'email'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Extract username from email
            base_email_name = email.split('@')[0]
            email_domain = email.split('@')[1]
            username = base_email_name
            
            # Make username unique if needed
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_email_name}{counter}"
                counter += 1

            # Update the validated data with unique username
            serializer.validated_data['username'] = username
            
            user = serializer.save()
            
            # Send verification email
            try:
                verification_link = f"{settings.FRONTEND_URL}/auth/verify-email?token={user.verification_token}"
                send_mail(
                    'Verify your email',
                    f'Click the link to verify your email: {verification_link}',
                    settings.EMAIL_HOST_USER,
                    [user.email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Failed to send email: {e}")

            token = Token.objects.create(user=user)

            return Response({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'is_verified': user.is_verified,
                    'is_google_account': user.is_google_account,
                },
                'token': str(token),
                'message': 'User created successfully. Please check your email for verification.',
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            try:
                user = User.objects.get(email=email)
                if not user.is_verified and not user.is_google_account:
                    return Response({
                        'detail': 'Please verify your email to login.'
                    }, status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                return Response({
                    'detail': 'No account found with this email.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if user:
                # This will either get the existing token or create a new one
                token, _ = Token.objects.get_or_create(user=user)

                return Response({
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'is_verified': user.is_verified,
                        'is_google_account': user.is_google_account,
                    },
                    'token': {  
                        'refresh_token': '',
                        'access_token': str(token),
                    },
                    'detail': 'Login successful.'
                }, status=status.HTTP_200_OK)
            return Response({
                'detail': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class VerifyEmailView(APIView):
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = EmailVerificationSerializer(data={'token': token})
        print(serializer)
        
        if serializer.is_valid():
            try:
                user = User.objects.get(verification_token=token)
                user.is_verified = True
                user.verification_token = None
                user.save()

                return Response({
                    'detail': 'Email verified successfully.'
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({
                    'detail': 'Invalid verification token.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleAuthView(APIView):
    def post(self, request):
        google_id = request.data.get('google_id')
        email = request.data.get('email')
        access_token = request.data.get('access_token')
        refresh_token = request.data.get('refresh_token')

        try:
            # Update existing user
            user = User.objects.get(email=email)
            user.google_access_token = access_token
            if refresh_token:
                user.google_refresh_token = refresh_token
            user.save()
        except User.DoesNotExist:
            # Create new user if no account is found with the email
            user = User.objects.create(
                email=email,
                google_id=google_id,
                access_token=access_token,
                refresh_token=refresh_token,
                is_google_account=True,
                is_verified=True,
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'is_verified': user.is_verified,
                'is_google_account': user.is_google_account,
            },
            'token': {
                'refresh_token': str(refresh.refresh_token),
                'access_token': str(refresh.access_token),
            },
            'detail': 'Login successful.'
        }, status=status.HTTP_200_OK)

      